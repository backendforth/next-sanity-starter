export type AnalyticsLoadMode = "onPageLoad" | "respectCookieBanner";

export type TrackerProvider =
	| "trackerGoogleAnalytics"
	| "trackerMatomo"
	| "trackerMicrosoftClarity"
	| "trackerPostHog"
	| "trackerPlausible";

type TrackerBase = {
	_key: string;
	_type: TrackerProvider;
	enabled?: boolean | null;
	cookieFree?: boolean | null;
	cookieBannerLabel?: string | null;
	cookieBannerDescription?: string | null;
};

export type TrackerGoogleAnalytics = TrackerBase & {
	_type: "trackerGoogleAnalytics";
	measurementId?: string | null;
};

export type TrackerMatomo = TrackerBase & {
	_type: "trackerMatomo";
	url?: string | null;
	siteId?: string | null;
};

export type TrackerMicrosoftClarity = TrackerBase & {
	_type: "trackerMicrosoftClarity";
	projectId?: string | null;
};

export type TrackerPostHog = TrackerBase & {
	_type: "trackerPostHog";
	apiKey?: string | null;
	apiHost?: string | null;
};

export type TrackerPlausible = TrackerBase & {
	_type: "trackerPlausible";
	domain?: string | null;
	scriptUrl?: string | null;
};

export type AnalyticsTracker =
	| TrackerGoogleAnalytics
	| TrackerMatomo
	| TrackerMicrosoftClarity
	| TrackerPostHog
	| TrackerPlausible;

export type SiteAnalyticsSettingsDocument = {
	_id: string;
	title?: string | null;
	loadMode?: AnalyticsLoadMode | null;
	trackers?: AnalyticsTracker[] | null;
};
