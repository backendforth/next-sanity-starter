"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

import type { SiteCookieBannerDocument } from "@/sanity/types/siteCookieBanner";

import { defaultSectionsFor } from "./defaultSections";

type Props = {
	doc: SiteCookieBannerDocument | null;
	locale: string;
};

function parseSections(
	raw: string | null | undefined,
	locale: string,
): CookieConsent.Section[] {
	if (typeof raw !== "string" || raw.trim().length === 0) {
		return defaultSectionsFor(locale);
	}
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return parsed as CookieConsent.Section[];
		}
	} catch (err) {
		console.warn("[CookieConsent] Failed to parse `sections` JSON:", err);
	}
	return defaultSectionsFor(locale);
}

function buildConfig(
	doc: SiteCookieBannerDocument,
	locale: string,
): CookieConsent.CookieConsentConfig {
	const sections = parseSections(doc.preferencesModal?.sections, locale);

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
	};
}

export function CookieConsentBanner({ doc, locale }: Props) {
	useEffect(() => {
		if (!doc?.useCookieBanner) return;
		CookieConsent.run(buildConfig(doc, locale)).catch((err) => {
			console.warn("[CookieConsent] run() failed:", err);
		});
	}, [doc, locale]);

	return null;
}
