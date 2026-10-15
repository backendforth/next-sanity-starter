"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";

/* Base CSS + theme overrides live here (not in `globals.css`) so they belong to
 * this module's chunk — loaded only when `LazyCookieConsentBanner` mounts the
 * banner, in this order (base first, overrides second). */
import "vanilla-cookieconsent/dist/cookieconsent.css";
import "@/src/assets/styles/components/cookieConsent.css";

import {
	markConsentLibraryStarted,
	notifyAnalyticsConsentChange,
	registerConsentLibrary,
} from "./cookieConsentApi";

type Props = {
	locale: string;
	/** Built on the server (`cookieConsentTranslation`): escaped texts for `locale`, tracker rows included. */
	translation: CookieConsent.Translation;
};

function buildConfig(
	locale: string,
	translation: CookieConsent.Translation,
): CookieConsent.CookieConsentConfig {
	const categories: CookieConsent.CookieConsentConfig["categories"] = {
		necessary: { enabled: true, readOnly: true },
	};
	for (const { linkedCategory } of translation.preferencesModal.sections) {
		if (linkedCategory && !categories[linkedCategory]) {
			categories[linkedCategory] = {};
		}
	}

	return {
		guiOptions: {
			consentModal: { layout: "box", position: "bottom right" },
			preferencesModal: { layout: "box" },
		},
		categories,
		language: {
			default: locale,
			translations: { [locale]: translation },
		},
		onConsent: () => {
			notifyAnalyticsConsentChange();
		},
		onChange: () => {
			notifyAnalyticsConsentChange();
		},
	};
}

export function CookieConsentBanner({ locale, translation }: Props) {
	useEffect(() => {
		registerConsentLibrary(CookieConsent);
		CookieConsent.run(buildConfig(locale, translation))
			.then(markConsentLibraryStarted)
			.catch((err) => {
				console.warn("[CookieConsent] run() failed:", err);
			});
	}, [locale, translation]);

	return null;
}
