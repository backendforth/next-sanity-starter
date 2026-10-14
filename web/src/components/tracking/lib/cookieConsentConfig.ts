import { stegaClean } from "next-sanity";
import type { Section } from "vanilla-cookieconsent";
import type { AnalyticsTracker, SiteCookieBanner } from "@/sanity/types";
import { defaultCookieSections } from "@/src/components/tracking/lib/defaultCookieSections";
import { isCookieFreeTracker } from "@/src/components/tracking/lib/trackingConfig";

type CookieTableRow = Record<string, string>;

const DEFAULT_CONSENT_DESCRIPTION =
	"Our website uses essential cookies for basic operation. Cookie-based analytics run only after you accept them; privacy-friendly analytics without cookies may load earlier.";

/**
 * The editor's `sections` JSON, clean: in Presentation the string carries stega markers, which
 * `JSON.parse` rejects — the banner then fell back to the default sections while editing.
 */
export function sectionsJsonFromSanity(
	sections: string | null | undefined,
): string | null {
	return sections ? stegaClean(sections) : null;
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
			// `sections` is free-form CMS JSON: a `body` that isn't an array would
			// throw here, before the banner ever starts.
			body: [
				...(Array.isArray(cookieTable.body) ? cookieTable.body : []),
				...trackers.map(trackerCookieRow),
			],
		},
	};
}

/** `sectionsJson`: the editor's JSON (`sectionsJsonFromSanity`) or a locale's defaults. */
export function buildCookieSections(
	sectionsJson: string | null | undefined,
	trackers: AnalyticsTracker[],
): Section[] {
	const base = parseSectionsJson(sectionsJson);
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

const HTML_ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * Banner description as HTML.
 *
 * vanilla-cookieconsent assigns this with `innerHTML`, so editor text is
 * escaped rather than trusted — otherwise anyone with Studio write access has a
 * stored-XSS path, and the CSP still allows inline script. The policy link is
 * the one bit of markup, built here from a URL field with a protocol allowlist
 * so `javascript:` cannot slip through.
 */
export function consentDescriptionHtml(
	consent: SiteCookieBanner["consentModal"] | null | undefined,
): string {
	const text = escapeHtml(
		consent?.description?.trim() || DEFAULT_CONSENT_DESCRIPTION,
	);
	const url = consent?.privacyPolicyUrl?.trim();
	if (!url || !/^(https?:\/\/|\/)/i.test(url)) return text;

	const label = escapeHtml(
		consent?.privacyPolicyLabel?.trim() || "Privacy policy",
	);
	return `${text} <a href="${escapeHtml(url)}">${label}</a>`;
}

export function buildCookieConsentTranslations(
	cookieBanner: SiteCookieBanner | null,
	trackers: AnalyticsTracker[],
) {
	const consent = cookieBanner?.consentModal;
	const preferences = cookieBanner?.preferencesModal;

	return {
		en: {
			consentModal: {
				description: consentDescriptionHtml(consent),
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
				sections: buildCookieSections(
					sectionsJsonFromSanity(cookieBanner?.preferencesModal?.sections),
					trackers,
				),
			},
		},
	};
}
