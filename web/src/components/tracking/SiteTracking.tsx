"use client";

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

		const loadAllowed = (analyticsAccepted: boolean) => {
			const allowed = trackersForConsent(trackers, config, analyticsAccepted);
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
			loadAllowed(hasConsent("analytics"));
			return subscribeAnalyticsConsent(loadAllowed);
		}

		loadAllowed(true);
	}, [config, showBanner, trackers]);

	return null;
}
