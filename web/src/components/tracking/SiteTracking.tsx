"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef } from "react";

import type { AnalyticsTracker } from "@/sanity/types";
import {
	hasConsent,
	subscribeAnalyticsConsent,
} from "@/src/components/cookies/cookieConsentApi";
import { loadTrackers } from "@/src/components/tracking/lib/loadTrackers";
import {
	bannerGatesLoading,
	getEnabledTrackers,
	type TrackingConfig,
	trackerLoadSignature,
	trackerRequiresConsent,
} from "@/src/components/tracking/lib/trackingConfig";
import {
	loadedTrackerEntries,
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
	/* Seeded from the runtime registry: after a remount (a locale switch re-renders the
	 * layout) trackers from the previous render are still running, and reconciling
	 * against an empty map would leave them collecting when the new config needs
	 * consent. */
	const loaded = useRef<Map<string, AnalyticsTracker> | null>(null);
	if (loaded.current === null) loaded.current = new Map(loadedTrackerEntries());
	const loadedMap = loaded.current;

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
			// edited in place keeps its `_key`, so compare what affects loading.
			const stale = Array.from(loadedMap.values()).filter((tracker) => {
				const next = allowedByKey.get(tracker._key);
				return (
					!next || trackerLoadSignature(next) !== trackerLoadSignature(tracker)
				);
			});
			if (stale.length > 0) {
				const needsReload = unloadTrackers(stale);
				for (const tracker of stale) {
					loadedMap.delete(tracker._key);
				}
				// PostHog edited in place (new key or host) can't be re-initialised: the
				// loaded SDK keeps sending to the old project. Reloading starts it with
				// the new settings; nothing is stale after that, so it doesn't loop.
				const replacesPostHog = stale.some(
					(tracker) =>
						tracker._type === "trackerPostHog" &&
						allowedByKey.has(tracker._key),
				);
				// Clarity's recorder cannot be torn down in place, so a reload is the
				// only thing that genuinely stops it. Safe from looping: after the
				// reload consent is already withdrawn, so it never loads again.
				if (needsReload || replacesPostHog) {
					window.location.reload();
					return;
				}
			}

			const pending = allowed.filter((tracker) => !loadedMap.has(tracker._key));
			if (pending.length === 0) return;
			// Recorded before loading, not after: PostHog initialises
			// asynchronously, so waiting would let a re-run inject it twice.
			for (const tracker of pending) {
				loadedMap.set(tracker._key, tracker);
			}
			loadTrackers(pending, {
				analyticsConsent: showBanner && analyticsAccepted,
			});
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
	}, [config, showBanner, trackers, loadedMap]);

	return (
		<Suspense fallback={null}>
			<PageViews loaded={loadedMap} />
		</Suspense>
	);
}

/**
 * Page views for client-side navigations, including query-only ones (`?q=a` → `?q=b`),
 * which `usePathname` alone never sees. Its own component behind `Suspense`:
 * `useSearchParams` would otherwise opt the whole layout out of static rendering.
 *
 * Providers emit their own view when they initialise; only navigations after that
 * need one, hence skipping the first run.
 */
function PageViews({ loaded }: { loaded: Map<string, AnalyticsTracker> }) {
	const pathname = usePathname();
	const search = useSearchParams().toString();
	const initialPageView = useRef(true);

	useEffect(() => {
		if (initialPageView.current) {
			initialPageView.current = false;
			return;
		}
		if (loaded.size === 0) return;
		trackPageView(pathname, search ? `?${search}` : "");
	}, [pathname, search, loaded]);

	return null;
}
