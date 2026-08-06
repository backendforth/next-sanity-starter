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

/** Cookie-free trackers may load without analytics consent when the banner is active. */
export function isCookieFreeTracker(tracker: AnalyticsTracker): boolean {
	if (tracker._type === "trackerPlausible") return true;
	return tracker.cookieFree === true;
}

export function trackerRequiresConsent(
	tracker: AnalyticsTracker,
	loadMode: AnalyticsLoadMode | null | undefined,
	cookieBanner: SiteCookieBannerDocument | null,
): boolean {
	if (!shouldRespectCookieBanner(loadMode, cookieBanner)) return false;
	return !isCookieFreeTracker(tracker);
}
