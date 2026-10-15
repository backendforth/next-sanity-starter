import type { AnalyticsTracker, SiteAnalyticsSettings } from "@/sanity/types";

export type { AnalyticsTracker };

/**
 * Loaders turn these CMS values into script URLs, so a relative one would load
 * from the site's own origin. Studio validation only runs in the editor; an
 * imported or API-written document skips it.
 */
function isAbsoluteHttpUrl(value: string | null | undefined): boolean {
	if (!value?.trim()) return false;
	try {
		const { protocol } = new URL(value.trim());
		return protocol === "https:" || protocol === "http:";
	} catch {
		return false;
	}
}

function isTrackerEnabled(tracker: AnalyticsTracker): boolean {
	if (tracker.enabled === false) return false;

	switch (tracker._type) {
		case "trackerGoogleAnalytics":
			return Boolean(tracker.measurementId?.trim());
		case "trackerMatomo":
			return isAbsoluteHttpUrl(tracker.url) && Boolean(tracker.siteId?.trim());
		case "trackerMicrosoftClarity":
			return Boolean(tracker.projectId?.trim());
		case "trackerPostHog":
			return (
				Boolean(tracker.apiKey?.trim()) && isAbsoluteHttpUrl(tracker.apiHost)
			);
		case "trackerPlausible":
			return (
				Boolean(tracker.domain?.trim()) && isAbsoluteHttpUrl(tracker.scriptUrl)
			);
		default:
			return false;
	}
}

export function getEnabledTrackers(
	analytics: SiteAnalyticsSettings | null,
): AnalyticsTracker[] {
	return (analytics?.trackers ?? []).filter(isTrackerEnabled);
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
 * Whether the cookie banner is on. Only an explicit `false` turns it off, so a document without
 * the field (unmigrated or API-written) shows the banner and gates trackers instead of failing
 * open. No analytics document means no trackers, and no banner.
 */
export function cookieBannerEnabled(
	analytics: SiteAnalyticsSettings | null,
): boolean {
	return analytics !== null && analytics.useCookieBanner !== false;
}

/**
 * Whether the banner gates loading: it is on and `loadMode` does not opt out. Compared with the
 * opt-out value for the same reason: a document missing `loadMode` still waits for consent.
 */
export function bannerGatesLoading(
	analytics: SiteAnalyticsSettings | null,
): boolean {
	return cookieBannerEnabled(analytics) && analytics?.loadMode !== "onPageLoad";
}

/**
 * The fields that actually change how a tracker loads.
 *
 * Reconciliation compares this rather than the whole document: an edit to a
 * display-only field like `cookieBannerLabel` would otherwise count as a config
 * change and tear the provider down — and for Clarity a teardown means a full
 * page reload, which is not something a copy edit should cause.
 */
export function trackerLoadSignature(tracker: AnalyticsTracker): string {
	switch (tracker._type) {
		case "trackerGoogleAnalytics":
			return `ga:${tracker.measurementId}:${tracker.cookieFree}`;
		case "trackerMatomo":
			return `matomo:${tracker.url}:${tracker.siteId}:${tracker.cookieFree}`;
		case "trackerMicrosoftClarity":
			return `clarity:${tracker.projectId}`;
		case "trackerPostHog":
			return `posthog:${tracker.apiKey}:${tracker.apiHost}:${tracker.cookieFree}`;
		case "trackerPlausible":
			return `plausible:${tracker.domain}:${tracker.scriptUrl}`;
		default:
			return JSON.stringify(tracker);
	}
}

export function trackerRequiresConsent(
	tracker: AnalyticsTracker,
	analytics: SiteAnalyticsSettings | null,
): boolean {
	return bannerGatesLoading(analytics) && !isCookieFreeTracker(tracker);
}
