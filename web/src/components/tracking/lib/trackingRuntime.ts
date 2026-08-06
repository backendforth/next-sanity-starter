import type { AnalyticsTracker } from "@/sanity/types/siteAnalyticsSettings";

type LoadedTracker = {
	tracker: AnalyticsTracker;
};

const loadedTrackers = new Map<string, LoadedTracker>();

export function isTrackerLoaded(key: string): boolean {
	return loadedTrackers.has(key);
}

export function registerLoadedTracker(tracker: AnalyticsTracker): void {
	loadedTrackers.set(tracker._key, { tracker });
}

export function unregisterLoadedTracker(key: string): void {
	loadedTrackers.delete(key);
}

export function trackPageView(pathname: string, search = ""): void {
	const url = `${pathname}${search}`;

	for (const { tracker } of loadedTrackers.values()) {
		switch (tracker._type) {
			case "trackerGoogleAnalytics": {
				const id = tracker.measurementId?.trim();
				if (!id) break;
				const gtag = (
					window as Window & {
						gtag?: (...args: unknown[]) => void;
					}
				).gtag;
				gtag?.("event", "page_view", {
					page_path: url,
					send_to: id,
				});
				break;
			}
			case "trackerMatomo": {
				const _paq = (
					window as Window & {
						_paq?: unknown[][];
					}
				)._paq;
				_paq?.push(["setCustomUrl", url]);
				_paq?.push(["trackPageView"]);
				break;
			}
			case "trackerPostHog": {
				const posthog = (
					window as Window & {
						posthog?: { capture?: (event: string) => void };
					}
				).posthog;
				posthog?.capture?.("$pageview");
				break;
			}
			case "trackerPlausible": {
				const plausible = (
					window as Window & {
						plausible?: (event: string, options?: { u: string }) => void;
					}
				).plausible;
				plausible?.("pageview", { u: url });
				break;
			}
			default:
				break;
		}
	}
}

export function unloadTracker(tracker: AnalyticsTracker): void {
	switch (tracker._type) {
		case "trackerGoogleAnalytics": {
			const id = tracker.measurementId?.trim();
			if (id) {
				(window as unknown as Record<string, boolean | undefined>)[
					`ga-disable-${id}`
				] = true;
			}
			break;
		}
		case "trackerMatomo": {
			const _paq = (
				window as Window & {
					_paq?: unknown[][];
				}
			)._paq;
			_paq?.push(["optUserOut"]);
			_paq?.push(["deleteCookies"]);
			break;
		}
		case "trackerMicrosoftClarity": {
			const clarity = (
				window as Window & {
					clarity?: ((...args: unknown[]) => void) & { q?: unknown[] };
				}
			).clarity;
			if (clarity) {
				clarity.q = [];
				(
					window as Window & { clarity?: (...args: unknown[]) => void }
				).clarity = () => {};
			}
			break;
		}
		case "trackerPostHog": {
			const posthog = (
				window as Window & {
					posthog?: {
						opt_out_capturing?: () => void;
						reset?: () => void;
					};
				}
			).posthog;
			posthog?.opt_out_capturing?.();
			posthog?.reset?.();
			break;
		}
		case "trackerPlausible":
			break;
	}

	unregisterLoadedTracker(tracker._key);
}

export function unloadTrackers(trackers: AnalyticsTracker[]): void {
	for (const tracker of trackers) {
		unloadTracker(tracker);
	}
}
