import type { Section } from "vanilla-cookieconsent";
import type { AnalyticsTracker } from "@/sanity/types/siteAnalyticsSettings";
import type { SiteCookieBannerDocument } from "@/sanity/types/siteCookieBanner";
import { defaultCookieSections } from "@/src/components/tracking/lib/defaultCookieSections";
import { isCookieFreeTracker } from "@/src/components/tracking/lib/trackingConfig";

type CookieTableRow = Record<string, string>;

const DEFAULT_CONSENT_DESCRIPTION =
	"Our website uses essential cookies for basic operation. Cookie-based analytics run only after you accept them; privacy-friendly analytics without cookies may load earlier.";

export function sectionsJsonFromSanity(
	sections: string | { code?: string | null } | null | undefined,
): string | null {
	if (typeof sections === "string") return sections;
	if (sections && typeof sections === "object" && "code" in sections) {
		const code = (sections as { code?: unknown }).code;
		return typeof code === "string" ? code : null;
	}
	return null;
}

function parseSectionsJson(raw: string | null | undefined): Section[] {
	if (!raw?.trim()) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? (parsed as Section[]) : [];
	} catch {
		return [];
	}
}

/**
 * Never throws. These values come from the CMS, and `new URL` on a relative or
 * malformed one would take down the whole consent banner — leaving no way to
 * give or withdraw consent at all.
 */
function hostnameOf(
	value: string | null | undefined,
	fallback: string,
): string {
	if (!value) return fallback;
	try {
		return new URL(value).hostname;
	} catch {
		return fallback;
	}
}

function trackerCookieRow(tracker: AnalyticsTracker): CookieTableRow {
	const label = tracker.cookieBannerLabel?.trim() || tracker._type;
	const baseDescription =
		tracker.cookieBannerDescription?.trim() ||
		"Analytics provider configured in Sanity.";
	const description = isCookieFreeTracker(tracker)
		? `${baseDescription} (cookie-free — loads without analytics consent)`
		: baseDescription;

	let domain = "—";
	switch (tracker._type) {
		case "trackerGoogleAnalytics":
			domain = "google-analytics.com";
			break;
		case "trackerMatomo":
			domain = hostnameOf(tracker.url, "matomo");
			break;
		case "trackerMicrosoftClarity":
			domain = "clarity.ms";
			break;
		case "trackerPostHog":
			domain = hostnameOf(tracker.apiHost, "posthog.com");
			break;
		case "trackerPlausible":
			domain = hostnameOf(tracker.scriptUrl, "plausible.io");
			break;
	}

	return {
		name: label,
		domain,
		desc: description,
	};
}

function isAnalyticsSection(section: Section): boolean {
	const sectionId = (section as Section & { id?: string }).id;
	return section.linkedCategory === "analytics" || sectionId === "analytics";
}

/** Append one disclosure row per tracker to an analytics section. */
function withTrackerRows(
	section: Section,
	trackers: AnalyticsTracker[],
): Section {
	const cookieTable = section.cookieTable ?? {
		headers: { name: "Name", domain: "Domain", desc: "Description" },
		body: [] as CookieTableRow[],
	};

	return {
		...section,
		// A section identified only by `id` still needs the link: consent
		// categories are derived from `linkedCategory`, so without it there is no
		// `analytics` category to grant and gated trackers can never load.
		linkedCategory: "analytics",
		cookieTable: {
			...cookieTable,
			body: [...(cookieTable.body ?? []), ...trackers.map(trackerCookieRow)],
		},
	};
}

export function buildCookieSections(
	cookieBanner: SiteCookieBannerDocument | null,
	trackers: AnalyticsTracker[],
): Section[] {
	const sectionsRaw = sectionsJsonFromSanity(
		cookieBanner?.preferencesModal?.sections ?? null,
	);
	const base = parseSectionsJson(sectionsRaw);
	const fallback = parseSectionsJson(defaultCookieSections);
	const sections = base.length > 0 ? base : fallback;

	const withRows = sections.map((section) =>
		isAnalyticsSection(section) ? withTrackerRows(section, trackers) : section,
	);

	if (trackers.length === 0 || withRows.some(isAnalyticsSection)) {
		return withRows;
	}

	// The editor-authored JSON is free-form, so the analytics section can be
	// renamed or deleted. Without one there is no `analytics` category to grant,
	// which both hides the disclosure and leaves consent-gated trackers unable to
	// ever load — so synthesise it rather than silently dropping both.
	return [
		...withRows,
		withTrackerRows(
			{ title: "Analytics", linkedCategory: "analytics" },
			trackers,
		),
	];
}

export function buildCookieConsentTranslations(
	cookieBanner: SiteCookieBannerDocument | null,
	trackers: AnalyticsTracker[],
) {
	const consent = cookieBanner?.consentModal;
	const preferences = cookieBanner?.preferencesModal;

	return {
		en: {
			consentModal: {
				description: consent?.description ?? DEFAULT_CONSENT_DESCRIPTION,
				acceptAllBtn: consent?.acceptAllBtn ?? "Accept",
				acceptNecessaryBtn: consent?.acceptNecessaryBtn ?? "Reject",
				showPreferencesBtn: consent?.showPreferencesBtn ?? "Manage preferences",
			},
			preferencesModal: {
				title: preferences?.title ?? "Cookie preferences",
				acceptAllBtn: preferences?.acceptAllBtn ?? "Accept all",
				acceptNecessaryBtn: preferences?.acceptNecessaryBtn ?? "Reject all",
				savePreferencesBtn:
					preferences?.savePreferencesBtn ?? "Save preferences",
				sections: buildCookieSections(cookieBanner, trackers),
			},
		},
	};
}
