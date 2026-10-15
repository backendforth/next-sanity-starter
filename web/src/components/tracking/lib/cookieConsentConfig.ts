import { stegaClean } from "next-sanity";
import type { Section, Translation } from "vanilla-cookieconsent";

import type { AnalyticsTracker, SiteCookieBanner } from "@/sanity/types";
import {
	type LinkLocaleOptions,
	resolveLinkMark,
} from "@/sanity/utils/linkResolver";
import { resolveLinkLabel } from "@/sanity/utils/resolveLinkLabel";
import { defaultSectionsFor } from "@/src/components/cookies/defaultSections";
import { isCookieFreeTracker } from "@/src/components/tracking/lib/trackingConfig";

type CookieTableRow = Record<string, string>;
type ConsentModal = NonNullable<SiteCookieBanner["consentModal"]>;

const TABLE_HEADERS = { name: "Name", domain: "Domain", desc: "Description" };

const DEFAULT_CONSENT_DESCRIPTION =
	"Our website uses essential cookies for basic operation. Cookie-based analytics run only after you accept them; privacy-friendly analytics without cookies may load earlier.";

const HTML_ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

/**
 * vanilla-cookieconsent assigns every text with `innerHTML`, so editor text is escaped rather
 * than trusted — otherwise anyone with Studio write access has a stored-XSS path, and the CSP
 * still allows inline script.
 */
function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
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
		name: escapeHtml(label),
		domain: escapeHtml(domain),
		desc: escapeHtml(description),
	};
}

function isAnalyticsSection(section: Section): boolean {
	return section.linkedCategory === "analytics";
}

/** Append one disclosure row per tracker to an analytics section. */
function withTrackerRows(
	section: Section,
	trackers: AnalyticsTracker[],
): Section {
	const table = section.cookieTable ?? { headers: TABLE_HEADERS, body: [] };
	return {
		...section,
		cookieTable: {
			...table,
			body: [...table.body, ...trackers.map(trackerCookieRow)],
		},
	};
}

function withTrackerSection(
	sections: Section[],
	trackers: AnalyticsTracker[],
): Section[] {
	const withRows = sections.map((section) =>
		isAnalyticsSection(section) ? withTrackerRows(section, trackers) : section,
	);

	if (trackers.length === 0 || withRows.some(isAnalyticsSection)) {
		return withRows;
	}

	// An editor can delete the analytics section or clear its category. Without one there is no
	// `analytics` category to grant, which both hides the disclosure and leaves consent-gated
	// trackers unable to ever load — so synthesise it rather than silently dropping both.
	return [
		...withRows,
		withTrackerRows(
			{ title: "Analytics", linkedCategory: "analytics" },
			trackers,
		),
	];
}

/**
 * The policy link, appended to the description. An internal page gets the route's locale
 * prefix from `resolveLinkMark`; the href also passes a protocol allowlist, so `javascript:`
 * cannot slip into the markup.
 */
function privacyPolicyHtml(
	link: ConsentModal["privacyPolicy"] | null | undefined,
	options: LinkLocaleOptions,
): string | null {
	const resolved = resolveLinkMark(link, options);
	if (resolved?.kind !== "anchor") return null;
	const href = stegaClean(resolved.href).trim();
	if (!/^(https?:\/\/|\/)/i.test(href)) return null;

	const label = resolveLinkLabel({
		linkTitle: link?.title,
		locale: options.locale,
		siteLocale: options.siteLocale,
		literalFallback: "Privacy policy",
	});
	const target = resolved.target
		? ` target="${resolved.target}" rel="${resolved.rel}"`
		: "";
	return `<a href="${escapeHtml(href)}"${target}>${escapeHtml(label)}</a>`;
}

/**
 * The banner for one route, built on the server: every text resolved for `options.locale`,
 * escaped, with the defaults filled in and the tracker rows appended. The client banner gets
 * only this.
 */
export function cookieConsentTranslation(
	doc: SiteCookieBanner,
	trackers: AnalyticsTracker[],
	options: LinkLocaleOptions,
): Translation {
	const { locale } = options;
	/* How the branch stores a banner text: plain here. Blank values still carry stega markers in
	 * Presentation, hence the clean before the emptiness check. */
	const read = (value: string | null | undefined) =>
		value && stegaClean(value).trim() ? value : undefined;
	const text = (value: string | null | undefined, fallback = "") =>
		escapeHtml(read(value) ?? fallback);

	const consent = doc.consentModal;
	const preferences = doc.preferencesModal;

	const sections: Section[] = (preferences?.sections ?? []).map((section) => ({
		title: text(section.title),
		description: text(section.description),
		linkedCategory: stegaClean(section.linkedCategory) ?? undefined,
		cookieTable: {
			headers: TABLE_HEADERS,
			body: (section.cookies ?? []).map((cookie) => ({
				name: text(cookie.name),
				domain: text(cookie.domain),
				desc: text(cookie.description),
			})),
		},
	}));

	const description = text(consent?.description, DEFAULT_CONSENT_DESCRIPTION);
	const policyLink = privacyPolicyHtml(consent?.privacyPolicy, options);

	return {
		consentModal: {
			title: "",
			description: policyLink ? `${description} ${policyLink}` : description,
			acceptAllBtn: text(consent?.acceptAllBtn, "Accept"),
			acceptNecessaryBtn: text(consent?.acceptNecessaryBtn, "Reject"),
			showPreferencesBtn: text(
				consent?.showPreferencesBtn,
				"Manage preferences",
			),
		},
		preferencesModal: {
			title: text(preferences?.title, "Cookie preferences"),
			acceptAllBtn: text(preferences?.acceptAllBtn, "Accept all"),
			acceptNecessaryBtn: text(preferences?.acceptNecessaryBtn, "Reject all"),
			savePreferencesBtn: text(
				preferences?.savePreferencesBtn,
				"Save preferences",
			),
			sections: withTrackerSection(
				sections.length > 0 ? sections : defaultSectionsFor(locale),
				trackers,
			),
		},
	};
}
