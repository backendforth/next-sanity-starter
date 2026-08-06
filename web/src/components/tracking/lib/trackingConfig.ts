import type {
	AnalyticsLoadMode,
	AnalyticsTracker,
	SiteAnalyticsSettingsDocument,
} from "@/sanity/types/siteAnalyticsSettings";
import type { SiteCookieBannerDocument } from "@/sanity/types/siteCookieBanner";

export type TrackingConfig = {
	analytics: SiteAnalyticsSettingsDocument | null;
	cookieBanner: SiteCookieBannerDocument | null;
};

export type { AnalyticsLoadMode, AnalyticsTracker };

export function isTrackerEnabled(tracker: AnalyticsTracker): boolean {
	if (tracker.enabled === false) return false;

	switch (tracker._type) {
		case "trackerGoogleAnalytics":
			return Boolean(tracker.measurementId?.trim());
		case "trackerMatomo":
			return Boolean(tracker.url?.trim() && tracker.siteId?.trim());
		case "trackerMicrosoftClarity":
			return Boolean(tracker.projectId?.trim());
		case "trackerPostHog":
			return Boolean(tracker.apiKey?.trim() && tracker.apiHost?.trim());
		case "trackerPlausible":
			return Boolean(tracker.domain?.trim() && tracker.scriptUrl?.trim());
		default:
			return false;
	}
}

export function getEnabledTrackers(
	analytics: SiteAnalyticsSettingsDocument | null,
): AnalyticsTracker[] {
	return (analytics?.trackers ?? []).filter(isTrackerEnabled);
}

export function isCookieBannerActive(
	cookieBanner: SiteCookieBannerDocument | null,
): boolean {
	return cookieBanner?.useCookieBanner === true;
}

export function shouldRespectCookieBanner(
	loadMode: AnalyticsLoadMode | null | undefined,
	cookieBanner: SiteCookieBannerDocument | null,
): boolean {
	if (loadMode === "onPageLoad") return false;
	return isCookieBannerActive(cookieBanner);
}

/**
 * Providers that never qualify as cookie-free, whatever the document says.
 *
 * Clarity has no cookie-free mode, and its Studio field is `readOnly` — but
 * that is a UI affordance, not a data invariant. An imported or API-written
 * document carrying `cookieFree: true` would otherwise load Clarity before
 * consent, which is exactly the case that must never happen.
 */
const NEVER_COOKIE_FREE: ReadonlySet<AnalyticsTracker["_type"]> = new Set([
	"trackerMicrosoftClarity",
]);

/** Cookie-free trackers may load without analytics consent when the banner is active. */
export function isCookieFreeTracker(tracker: AnalyticsTracker): boolean {
	if (NEVER_COOKIE_FREE.has(tracker._type)) return false;
	if (tracker._type === "trackerPlausible") return true;
	return tracker.cookieFree === true;
}

/**
 * Whether the banner gates loading for this document.
 *
 * Derived from `shouldRespectCookieBanner` rather than an equality check on
 * `loadMode`, so a document missing that field (legacy or API-written) still
 * waits for consent instead of failing open.
 */
export function bannerGatesLoading(config: {
	analytics: SiteAnalyticsSettingsDocument | null;
	cookieBanner: SiteCookieBannerDocument | null;
}): boolean {
	return shouldRespectCookieBanner(
		config.analytics?.loadMode,
		config.cookieBanner,
	);
}

export function trackerRequiresConsent(
	tracker: AnalyticsTracker,
	loadMode: AnalyticsLoadMode | null | undefined,
	cookieBanner: SiteCookieBannerDocument | null,
): boolean {
	if (!shouldRespectCookieBanner(loadMode, cookieBanner)) return false;
	return !isCookieFreeTracker(tracker);
}

/** Whether two tracker configs would load the same runtime integration. */
export function trackerRuntimeConfigEqual(
	a: AnalyticsTracker,
	b: AnalyticsTracker,
): boolean {
	return trackerRuntimeFingerprint(a) === trackerRuntimeFingerprint(b);
}

function trackerRuntimeFingerprint(tracker: AnalyticsTracker): string {
	const cookieFree = tracker.cookieFree === true;

	switch (tracker._type) {
		case "trackerGoogleAnalytics":
			return `${tracker._type}|${cookieFree}|${tracker.measurementId?.trim() ?? ""}`;
		case "trackerMatomo":
			return `${tracker._type}|${cookieFree}|${tracker.url?.trim() ?? ""}|${tracker.siteId?.trim() ?? ""}`;
		case "trackerMicrosoftClarity":
			return `${tracker._type}|${cookieFree}|${tracker.projectId?.trim() ?? ""}`;
		case "trackerPostHog":
			return `${tracker._type}|${cookieFree}|${tracker.apiKey?.trim() ?? ""}|${tracker.apiHost?.trim() ?? ""}`;
		case "trackerPlausible":
			return `${tracker._type}|${cookieFree}|${tracker.domain?.trim() ?? ""}|${tracker.scriptUrl?.trim() ?? ""}`;
	}
}
