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
	bannerGatesLoading,
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
	const loaded = useRef(new Map<string, AnalyticsTracker>());
	const initialPageView = useRef(true);
	const pathname = usePathname();

	const trackers = useMemo(
		() => getEnabledTrackers(config.analytics),
		[config.analytics],
	);

	const showBanner = bannerGatesLoading(config);

	useEffect(() => {
		const syncConsent = (analyticsAccepted: boolean) => {
			const allowed = trackersForConsent(trackers, config, analyticsAccepted);
			const allowedByKey = new Map(
				allowed.map((tracker) => [tracker._key, tracker]),
			);

			// Reconcile against what is running, not against the current document.
			// A tracker disabled or deleted in Sanity vanishes from `trackers`
			// entirely, so comparing the two would leave it collecting; a tracker
			// edited in place keeps its `_key`, so compare the value too.
			const stale = Array.from(loaded.current.values()).filter((tracker) => {
				const next = allowedByKey.get(tracker._key);
				return !next || JSON.stringify(next) !== JSON.stringify(tracker);
			});
			if (stale.length > 0) {
				const needsReload = unloadTrackers(stale);
				for (const tracker of stale) {
					loaded.current.delete(tracker._key);
				}
				// Clarity's recorder cannot be torn down in place, so a reload is the
				// only thing that genuinely stops it. Safe from looping: after the
				// reload consent is already withdrawn, so it never loads again.
				if (needsReload) {
					window.location.reload();
					return;
				}
			}

			const pending = allowed.filter(
				(tracker) => !loaded.current.has(tracker._key),
			);
			if (pending.length === 0) return;
			// Recorded before loading, not after: PostHog initialises
			// asynchronously, so waiting would let a re-run inject it twice.
			for (const tracker of pending) {
				loaded.current.set(tracker._key, tracker);
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
		if (loaded.current.size === 0) return;
		trackPageView(pathname, window.location.search);
	}, [pathname]);

	return null;
}
