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

/**
 * What the library was started with. `run()` initialises it once per page load and ignores
 * later calls, so a client-side language switch (or a content edit) would keep the old texts.
 */
let runningConfig: string | null = null;

export function CookieConsentBanner({ locale, translation }: Props) {
	useEffect(() => {
		const key = JSON.stringify([locale, translation]);
		if (key === runningConfig) return;
		// `false` keeps the consent cookie: a restart changes the texts, not the visitor's choice.
		if (runningConfig !== null) CookieConsent.reset(false);
		runningConfig = key;
		registerConsentLibrary(CookieConsent);
		CookieConsent.run(buildConfig(locale, translation))
			.then(() => {
				if (runningConfig === key) markConsentLibraryStarted();
			})
			.catch((err) => {
				console.warn("[CookieConsent] run() failed:", err);
			});
	}, [locale, translation]);

	return null;
}
