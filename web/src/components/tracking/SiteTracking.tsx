"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import type { AnalyticsTracker } from "@/sanity/types/siteAnalyticsSettings";
import {
	hasConsent,
	subscribeAnalyticsConsent,
} from "@/src/components/cookies/cookieConsentApi";
import { loadTrackers } from "@/src/components/tracking/lib/loadTrackers";
import {
	getEnabledTrackers,
	type TrackingConfig,
	trackerRequiresConsent,
} from "@/src/components/tracking/lib/trackingConfig";
import {
	trackPageView,
	unloadTrackers,
} from "@/src/components/tracking/lib/trackingRuntime";

type Props = {
	config: TrackingConfig;
};

function trackersForConsent(
	trackers: AnalyticsTracker[],
	config: TrackingConfig,
	analyticsAccepted: boolean,
): AnalyticsTracker[] {
	return trackers.filter((tracker) => {
		const needsConsent = trackerRequiresConsent(
			tracker,
			config.analytics?.loadMode,
			config.cookieBanner,
		);
		return !needsConsent || analyticsAccepted;
	});
}

export function SiteTracking({ config }: Props) {
	const initialized = useRef(false);
	const consentLoaded = useRef(new Set<string>());
	const skipNextPageView = useRef(true);
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const trackers = useMemo(
		() => getEnabledTrackers(config.analytics),
		[config.analytics],
	);

	const showBanner =
		config.cookieBanner?.useCookieBanner === true &&
		config.analytics?.loadMode === "respectCookieBanner";

	useEffect(() => {
		if (initialized.current || trackers.length === 0) return;
		initialized.current = true;

		const syncTrackers = (analyticsAccepted: boolean) => {
			const allowed = trackersForConsent(trackers, config, analyticsAccepted);
			const allowedKeys = new Set(allowed.map((tracker) => tracker._key));

			const toUnload = trackers.filter(
				(tracker) =>
					consentLoaded.current.has(tracker._key) &&
					!allowedKeys.has(tracker._key),
			);
			if (toUnload.length > 0) {
				unloadTrackers(toUnload);
				for (const tracker of toUnload) {
					consentLoaded.current.delete(tracker._key);
				}
			}

			const pending = allowed.filter(
				(tracker) => !consentLoaded.current.has(tracker._key),
			);
			if (pending.length === 0) return;
			for (const tracker of pending) {
				consentLoaded.current.add(tracker._key);
			}
			loadTrackers(pending);
		};

		if (showBanner) {
			syncTrackers(hasConsent("analytics"));
			return subscribeAnalyticsConsent(syncTrackers);
		}

		syncTrackers(true);
	}, [config, showBanner, trackers]);

	useEffect(() => {
		if (skipNextPageView.current) {
			skipNextPageView.current = false;
			return;
		}
		const search = searchParams.toString();
		trackPageView(pathname, search ? `?${search}` : "");
	}, [pathname, searchParams]);

	return null;
}
