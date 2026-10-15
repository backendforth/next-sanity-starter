import "server-only";

import { baseLanguage } from "./uiLabels";

/**
 * The cookie banner's default texts, for every text `siteCookieBanner` leaves empty. The banner
 * is built on the server (`cookieConsentTranslation`), so these stay out of `uiLabels.ts`, which
 * client components import. Add a locale here when you add one in `siteLanguageSettings`.
 * Unknown locales fall back to English.
 */

type CookieBannerLabels = {
	consentDescription: string;
	accept: string;
	reject: string;
	managePreferences: string;
	privacyPolicy: string;
	preferencesTitle: string;
	acceptAll: string;
	rejectAll: string;
	savePreferences: string;
	necessaryTitle: string;
	necessaryDescription: string;
	analyticsTitle: string;
	analyticsDescription: string;
	tableName: string;
	tableDomain: string;
	tableDescription: string;
	/** Row text for a tracker without a cookie banner description. */
	trackerDescription: string;
	/** Appended in brackets to a cookie-free tracker's row. */
	cookieFreeNote: string;
};

export type CookieBannerLabelKey = keyof CookieBannerLabels;

const LABELS: Record<string, CookieBannerLabels> & { en: CookieBannerLabels } =
	{
		de: {
			consentDescription:
				"Unsere Website verwendet notwendige Cookies für den Grundbetrieb. Analysen mit Cookies laufen erst, nachdem du zugestimmt hast; datenschutzfreundliche Analysen ohne Cookies können schon vorher laden.",
			accept: "Akzeptieren",
			reject: "Ablehnen",
			managePreferences: "Einstellungen verwalten",
			privacyPolicy: "Datenschutzerklärung",
			preferencesTitle: "Cookie-Einstellungen",
			acceptAll: "Alle akzeptieren",
			rejectAll: "Alle ablehnen",
			savePreferences: "Einstellungen speichern",
			necessaryTitle: "Unbedingt erforderlich",
			necessaryDescription:
				"Notwendig für den grundlegenden Betrieb der Website und nicht deaktivierbar.",
			analyticsTitle: "Analyse",
			analyticsDescription:
				"Hilft uns, die Nutzung der Website zu verstehen und das Erlebnis zu verbessern.",
			tableName: "Name",
			tableDomain: "Domain",
			tableDescription: "Beschreibung",
			trackerDescription: "In Sanity eingerichteter Analyse-Anbieter.",
			cookieFreeNote: "ohne Cookies — lädt ohne Einwilligung in Analysen",
		},
		en: {
			consentDescription:
				"Our website uses essential cookies for basic operation. Cookie-based analytics run only after you accept them; privacy-friendly analytics without cookies may load earlier.",
			accept: "Accept",
			reject: "Reject",
			managePreferences: "Manage preferences",
			privacyPolicy: "Privacy policy",
			preferencesTitle: "Cookie preferences",
			acceptAll: "Accept all",
			rejectAll: "Reject all",
			savePreferences: "Save preferences",
			necessaryTitle: "Strictly Necessary",
			necessaryDescription:
				"Essential for basic website functionality and cannot be disabled.",
			analyticsTitle: "Analytics",
			analyticsDescription:
				"Helps us understand usage patterns and improve the website experience.",
			tableName: "Name",
			tableDomain: "Domain",
			tableDescription: "Description",
			trackerDescription: "Analytics provider configured in Sanity.",
			cookieFreeNote: "cookie-free — loads without analytics consent",
		},
		fr: {
			consentDescription:
				"Notre site utilise des cookies essentiels à son fonctionnement. La mesure d’audience avec cookies ne démarre qu’après votre accord ; une mesure respectueuse de la vie privée, sans cookies, peut se charger avant.",
			accept: "Accepter",
			reject: "Refuser",
			managePreferences: "Gérer les préférences",
			privacyPolicy: "Politique de confidentialité",
			preferencesTitle: "Préférences de cookies",
			acceptAll: "Tout accepter",
			rejectAll: "Tout refuser",
			savePreferences: "Enregistrer les préférences",
			necessaryTitle: "Strictement nécessaires",
			necessaryDescription:
				"Indispensables au fonctionnement de base du site, ils ne peuvent pas être désactivés.",
			analyticsTitle: "Mesure d’audience",
			analyticsDescription:
				"Nous aide à comprendre l’utilisation du site et à l’améliorer.",
			tableName: "Nom",
			tableDomain: "Domaine",
			tableDescription: "Description",
			trackerDescription: "Outil de mesure d’audience configuré dans Sanity.",
			cookieFreeNote: "sans cookies — se charge sans consentement à la mesure",
		},
		nl: {
			consentDescription:
				"Onze website gebruikt essentiële cookies voor de basiswerking. Analyse met cookies start pas nadat je die accepteert; privacyvriendelijke analyse zonder cookies kan eerder laden.",
			accept: "Accepteren",
			reject: "Weigeren",
			managePreferences: "Voorkeuren beheren",
			privacyPolicy: "Privacybeleid",
			preferencesTitle: "Cookievoorkeuren",
			acceptAll: "Alles accepteren",
			rejectAll: "Alles weigeren",
			savePreferences: "Voorkeuren opslaan",
			necessaryTitle: "Strikt noodzakelijk",
			necessaryDescription:
				"Onmisbaar voor de basiswerking van de website en niet uit te schakelen.",
			analyticsTitle: "Analyse",
			analyticsDescription:
				"Helpt ons te begrijpen hoe de website wordt gebruikt en de ervaring te verbeteren.",
			tableName: "Naam",
			tableDomain: "Domein",
			tableDescription: "Beschrijving",
			trackerDescription: "In Sanity ingestelde analyseprovider.",
			cookieFreeNote: "zonder cookies — laadt zonder toestemming voor analyse",
		},
	};

export function cookieBannerLabel(
	key: CookieBannerLabelKey,
	locale: string,
): string {
	return (LABELS[locale] ?? LABELS[baseLanguage(locale)] ?? LABELS.en)[key];
}
