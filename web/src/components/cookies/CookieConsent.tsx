"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

import type { AnalyticsTracker } from "@/sanity/types/siteAnalyticsSettings";
import type { SiteCookieBannerDocument } from "@/sanity/types/siteCookieBanner";
import {
	buildCookieSections,
	sectionsJsonFromSanity,
} from "@/src/components/tracking/lib/cookieConsentConfig";
import { notifyAnalyticsConsentChange } from "./cookieConsentApi";
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
			JSON.parse(raw);
			return buildCookieSections(doc, trackers);
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
						description: doc.consentModal?.description ?? "",
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
		CookieConsent.run(buildConfig(doc, locale, trackers)).catch((err) => {
			console.warn("[CookieConsent] run() failed:", err);
		});
	}, [doc, locale, trackers]);

	return null;
}
