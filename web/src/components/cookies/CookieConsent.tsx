"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

/* Base CSS + theme overrides live here (not in `globals.css`) so they belong to
 * this module's chunk — loaded only when `LazyCookieConsentBanner` mounts the
 * banner, in this order (base first, overrides second). */
import "vanilla-cookieconsent/dist/cookieconsent.css";
import "@/src/assets/styles/components/cookieConsent.css";

import type { AnalyticsTracker } from "@/sanity/types/siteAnalyticsSettings";
import type { SiteCookieBannerDocument } from "@/sanity/types/siteCookieBanner";
import {
	buildCookieSections,
	consentDescriptionHtml,
	sectionsJsonFromSanity,
} from "@/src/components/tracking/lib/cookieConsentConfig";
import {
	markConsentLibraryStarted,
	notifyAnalyticsConsentChange,
	registerConsentLibrary,
} from "./cookieConsentApi";
import { defaultSectionsFor } from "./defaultSections";

type Props = {
	doc: SiteCookieBannerDocument | null;
	locale: string;
	trackers?: AnalyticsTracker[];
};

function parseSections(
	doc: SiteCookieBannerDocument,
	locale: string,
	trackers: AnalyticsTracker[],
): CookieConsent.Section[] {
	// The query projects `sections.code`, but normalise anyway so an unprojected
	// `code` object does not silently fall through to the defaults.
	const raw = sectionsJsonFromSanity(doc.preferencesModal?.sections);
	if (raw && raw.trim().length > 0) {
		try {
			// Valid JSON that isn't a list of sections (e.g. `{}`) falls through to
			// the locale's defaults below, not to the English-only builder defaults.
			if (Array.isArray(JSON.parse(raw))) {
				return buildCookieSections(doc, trackers);
			}
			console.warn("[CookieConsent] `sections` JSON is not an array.");
		} catch (err) {
			console.warn("[CookieConsent] Failed to parse `sections` JSON:", err);
		}
	}
	return buildCookieSections(
		{
			...doc,
			preferencesModal: {
				...doc.preferencesModal,
				sections: JSON.stringify(defaultSectionsFor(locale)),
			},
		},
		trackers,
	);
}

function buildConfig(
	doc: SiteCookieBannerDocument,
	locale: string,
	trackers: AnalyticsTracker[],
): CookieConsent.CookieConsentConfig {
	const sections = parseSections(doc, locale, trackers);

	const categoryKeys = new Set<string>(["necessary"]);
	for (const section of sections) {
		if (section.linkedCategory) {
			categoryKeys.add(section.linkedCategory);
		}
	}
	const categories: CookieConsent.CookieConsentConfig["categories"] = {};
	for (const key of categoryKeys) {
		categories[key] =
			key === "necessary" ? { enabled: true, readOnly: true } : {};
	}

	return {
		guiOptions: {
			consentModal: { layout: "box", position: "bottom right" },
			preferencesModal: { layout: "box" },
		},
		categories,
		language: {
			default: locale,
			translations: {
				[locale]: {
					consentModal: {
						title: "",
						description: consentDescriptionHtml(doc.consentModal),
						acceptAllBtn: doc.consentModal?.acceptAllBtn ?? "Accept",
						acceptNecessaryBtn:
							doc.consentModal?.acceptNecessaryBtn ?? "Reject",
						showPreferencesBtn:
							doc.consentModal?.showPreferencesBtn ?? "Manage preferences",
					},
					preferencesModal: {
						title: doc.preferencesModal?.title ?? "Cookie preferences",
						acceptAllBtn: doc.preferencesModal?.acceptAllBtn ?? "Accept all",
						acceptNecessaryBtn:
							doc.preferencesModal?.acceptNecessaryBtn ?? "Reject all",
						savePreferencesBtn:
							doc.preferencesModal?.savePreferencesBtn ?? "Save preferences",
						sections,
					},
				},
			},
		},
		onConsent: () => {
			notifyAnalyticsConsentChange();
		},
		onChange: () => {
			notifyAnalyticsConsentChange();
		},
	};
}

export function CookieConsentBanner({ doc, locale, trackers = [] }: Props) {
	useEffect(() => {
		if (!doc?.useCookieBanner) return;
		registerConsentLibrary(CookieConsent);
		CookieConsent.run(buildConfig(doc, locale, trackers))
			.then(markConsentLibraryStarted)
			.catch((err) => {
				console.warn("[CookieConsent] run() failed:", err);
			});
	}, [doc, locale, trackers]);

	return null;
}
