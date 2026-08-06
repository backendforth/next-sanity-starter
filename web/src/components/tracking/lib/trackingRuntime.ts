import type { AnalyticsTracker } from "@/sanity/types/siteAnalyticsSettings";

type LoadedTracker = {
	tracker: AnalyticsTracker;
};

const loadedTrackers = new Map<string, LoadedTracker>();

/**
 * Monotonic counter per tracker key, bumped on every load and unload.
 *
 * PostHog initialises asynchronously (script load plus a retry timer). If
 * consent is withdrawn while that is in flight, the pending callback would
 * otherwise still run `posthog.init` and start collecting *after* the
 * withdrawal. A loader captures the generation it started under and bails when
 * it no longer matches.
 */
const loadGenerations = new Map<string, number>();

export function isTrackerLoaded(key: string): boolean {
	return loadedTrackers.has(key);
}

/** Claim a load attempt; the returned generation guards async continuations. */
export function beginTrackerLoad(key: string): number {
	const generation = (loadGenerations.get(key) ?? 0) + 1;
	loadGenerations.set(key, generation);
	return generation;
}

export function isCurrentTrackerLoad(key: string, generation: number): boolean {
	return loadGenerations.get(key) === generation;
}

export function registerLoadedTracker(tracker: AnalyticsTracker): void {
	loadedTrackers.set(tracker._key, { tracker });
}

export function unregisterLoadedTracker(key: string): void {
	loadedTrackers.delete(key);
	// Invalidates any load still in flight for this key.
	beginTrackerLoad(key);
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

function cookieDomainScopes(hostname: string): string[] {
	const scopes = new Set(["", `; domain=${hostname}`, `; domain=.${hostname}`]);
	if (
		hostname !== "localhost" &&
		!hostname.includes(":") &&
		!/^\d+\.\d+\.\d+\.\d+$/.test(hostname)
	) {
		const parts = hostname.split(".");
		for (let index = 1; index < parts.length; index += 1) {
			const parent = parts.slice(index).join(".");
			if (!parent.includes(".")) continue;
			scopes.add(`; domain=${parent}`);
			scopes.add(`; domain=.${parent}`);
		}
	}
	return [...scopes];
}

/**
 * Best-effort cookie removal. The same name can exist on both the host and the
 * dot-prefixed domain, and we cannot know which the provider used, so clear
 * every plausible scope.
 */
function deleteCookies(matches: (name: string) => boolean): void {
	const scopes = cookieDomainScopes(window.location.hostname);
	for (const entry of document.cookie.split(";")) {
		const name = entry.split("=")[0]?.trim();
		if (!name || !matches(name)) continue;
		for (const scope of scopes) {
			// biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is Chromium-only and cannot target a parent domain, which is where analytics cookies usually live.
			document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${scope}`;
		}
	}
}

/**
 * Providers with no in-page teardown. Clarity's recorder keeps its own
 * references and listeners, so replacing the global only blocks new API calls —
 * a reload is the only thing that actually stops it collecting.
 */
function requiresReloadToStop(tracker: AnalyticsTracker): boolean {
	return tracker._type === "trackerMicrosoftClarity";
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
			deleteCookies(
				(name) =>
					name === "_ga" ||
					name === "_gid" ||
					name.startsWith("_ga_") ||
					name.startsWith("_gac_"),
			);
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
			deleteCookies((name) => name === "_clck" || name === "_clsk");
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
			deleteCookies((name) => name.startsWith("ph_"));
			break;
		}
		case "trackerPlausible":
			break;
	}

	unregisterLoadedTracker(tracker._key);
}

/** Returns true when a provider was stopped that only a reload fully tears down. */
export function unloadTrackers(trackers: AnalyticsTracker[]): boolean {
	let needsReload = false;
	for (const tracker of trackers) {
		unloadTracker(tracker);
		if (requiresReloadToStop(tracker)) needsReload = true;
	}
	return needsReload;
}
