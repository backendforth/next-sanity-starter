"use client";

import { usePathname } from "next/navigation";
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
	const consentLoaded = useRef(new Set<string>());
	const initialPageView = useRef(true);
	const pathname = usePathname();

	const trackers = useMemo(
		() => getEnabledTrackers(config.analytics),
		[config.analytics],
	);

	const showBanner =
		config.cookieBanner?.useCookieBanner === true &&
		config.analytics?.loadMode === "respectCookieBanner";

	useEffect(() => {
		if (trackers.length === 0) return;

		const syncConsent = (analyticsAccepted: boolean) => {
			const allowed = trackersForConsent(trackers, config, analyticsAccepted);
			const allowedKeys = new Set(allowed.map((tracker) => tracker._key));

			// Withdrawal has to stop collection, not just stop new loads — so tear
			// down anything already running that consent no longer covers.
			const revoked = trackers.filter(
				(tracker) =>
					consentLoaded.current.has(tracker._key) &&
					!allowedKeys.has(tracker._key),
			);
			if (revoked.length > 0) {
				unloadTrackers(revoked);
				for (const tracker of revoked) {
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

		// No one-shot guard here: the effect owns the consent subscription, so an
		// early return on re-run would drop it for good (Strict Mode remounts, or
		// any `config` change) and consent would never reach the loaders again.
		// `consentLoaded` is what keeps loads idempotent.
		if (showBanner) {
			syncConsent(hasConsent("analytics"));
			return subscribeAnalyticsConsent(syncConsent);
		}

		syncConsent(true);
	}, [config, showBanner, trackers]);

	// Providers emit their own view when they initialise; only client-side
	// navigations after that need one, hence skipping the first run.
	useEffect(() => {
		if (initialPageView.current) {
			initialPageView.current = false;
			return;
		}
		trackPageView(pathname, window.location.search);
	}, [pathname]);

	return null;
}
