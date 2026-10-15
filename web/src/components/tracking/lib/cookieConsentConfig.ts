import { stegaClean } from "next-sanity";
import type { Section, Translation } from "vanilla-cookieconsent";

import type { AnalyticsTracker, SiteCookieBanner } from "@/sanity/types";
import {
	type LinkLocaleOptions,
	resolveLinkMark,
} from "@/sanity/utils/linkResolver";
import { resolveLinkLabel } from "@/sanity/utils/resolveLinkLabel";
import {
	type LocalizedEntry,
	pickLocalizedString,
} from "@/sanity/utils/sanityLocalizedText";
import { isCookieFreeTracker } from "@/src/components/tracking/lib/trackingConfig";
import { type UiLabelKey, uiLabel } from "@/src/i18n/uiLabels";

type CookieTableRow = Record<string, string>;
type ConsentModal = NonNullable<SiteCookieBanner["consentModal"]>;
type LocalizedStrings =
	| ReadonlyArray<LocalizedEntry<string>>
	| null
	| undefined;

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

function tableHeaders(locale: string): CookieTableRow {
	return {
		name: uiLabel("cookieTableName", locale),
		domain: uiLabel("cookieTableDomain", locale),
		desc: uiLabel("cookieTableDescription", locale),
	};
}

function analyticsSection(locale: string): Section {
	return {
		title: uiLabel("cookieAnalyticsTitle", locale),
		description: uiLabel("cookieAnalyticsDescription", locale),
		linkedCategory: "analytics",
	};
}

/** What an empty `sections` field shows. */
function defaultSections(locale: string): Section[] {
	return [
		{
			title: uiLabel("cookieNecessaryTitle", locale),
			description: uiLabel("cookieNecessaryDescription", locale),
			linkedCategory: "necessary",
		},
		analyticsSection(locale),
	];
}

function trackerCookieRow(
	tracker: AnalyticsTracker,
	locale: string,
): CookieTableRow {
	const label = tracker.cookieBannerLabel?.trim() || tracker._type;
	const baseDescription =
		tracker.cookieBannerDescription?.trim() ||
		uiLabel("cookieTrackerDescription", locale);
	const description = isCookieFreeTracker(tracker)
		? `${baseDescription} (${uiLabel("cookieFreeNote", locale)})`
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
	locale: string,
): Section {
	const table = section.cookieTable ?? {
		headers: tableHeaders(locale),
		body: [],
	};
	return {
		...section,
		cookieTable: {
			...table,
			body: [
				...table.body,
				...trackers.map((tracker) => trackerCookieRow(tracker, locale)),
			],
		},
	};
}

function withTrackerSection(
	sections: Section[],
	trackers: AnalyticsTracker[],
	locale: string,
): Section[] {
	const withRows = sections.map((section) =>
		isAnalyticsSection(section)
			? withTrackerRows(section, trackers, locale)
			: section,
	);

	if (trackers.length === 0 || withRows.some(isAnalyticsSection)) {
		return withRows;
	}

	// An editor can delete the analytics section or clear its category. Without one there is no
	// `analytics` category to grant, which both hides the disclosure and leaves consent-gated
	// trackers unable to ever load — so synthesise it rather than silently dropping both.
	return [
		...withRows,
		withTrackerRows(analyticsSection(locale), trackers, locale),
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
		literalFallback: uiLabel("cookiePrivacyPolicy", options.locale),
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
	const { locale, siteLocale } = options;
	/* How the branch stores a banner text: `main` keeps every language in the field. */
	const read = (entries: LocalizedStrings) =>
		pickLocalizedString(entries, locale, siteLocale);
	const text = (entries: LocalizedStrings, fallback?: UiLabelKey) =>
		escapeHtml(read(entries) ?? (fallback ? uiLabel(fallback, locale) : ""));

	const consent = doc.consentModal;
	const preferences = doc.preferencesModal;

	const sections: Section[] = (preferences?.sections ?? []).map((section) => ({
		title: text(section.title),
		description: text(section.description),
		linkedCategory: stegaClean(section.linkedCategory) ?? undefined,
		cookieTable: {
			headers: tableHeaders(locale),
			body: (section.cookies ?? []).map((cookie) => ({
				name: escapeHtml(cookie.name ?? ""),
				domain: escapeHtml(cookie.domain ?? ""),
				desc: text(cookie.description),
			})),
		},
	}));

	const description = text(consent?.description, "cookieConsentDescription");
	const policyLink = privacyPolicyHtml(consent?.privacyPolicy, options);

	return {
		consentModal: {
			title: "",
			description: policyLink ? `${description} ${policyLink}` : description,
			acceptAllBtn: text(consent?.acceptAllBtn, "cookieAccept"),
			acceptNecessaryBtn: text(consent?.acceptNecessaryBtn, "cookieReject"),
			showPreferencesBtn: text(
				consent?.showPreferencesBtn,
				"cookieManagePreferences",
			),
		},
		preferencesModal: {
			title: text(preferences?.title, "cookiePreferencesTitle"),
			acceptAllBtn: text(preferences?.acceptAllBtn, "cookieAcceptAll"),
			acceptNecessaryBtn: text(
				preferences?.acceptNecessaryBtn,
				"cookieRejectAll",
			),
			savePreferencesBtn: text(
				preferences?.savePreferencesBtn,
				"cookieSavePreferences",
			),
			sections: withTrackerSection(
				sections.length > 0 ? sections : defaultSections(locale),
				trackers,
				locale,
			),
		},
	};
}
