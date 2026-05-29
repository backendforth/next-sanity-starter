import type * as CookieConsent from "vanilla-cookieconsent";

const sectionsEN: CookieConsent.Section[] = [
	{
		title: "Strictly Necessary",
		description:
			"Essential for basic website functionality and cannot be disabled.",
		linkedCategory: "necessary",
		cookieTable: {
			headers: { name: "Name", domain: "Domain", desc: "Description" },
			body: [],
		},
	},
	{
		title: "Analytics",
		description:
			"Helps us understand usage patterns and improve the website experience.",
		linkedCategory: "analytics",
		cookieTable: {
			headers: { name: "Name", domain: "Domain", desc: "Description" },
			body: [],
		},
	},
];

const sectionsDE: CookieConsent.Section[] = [
	{
		title: "Unbedingt erforderlich",
		description:
			"Notwendig für den grundlegenden Betrieb der Website und nicht deaktivierbar.",
		linkedCategory: "necessary",
		cookieTable: {
			headers: { name: "Name", domain: "Domain", desc: "Beschreibung" },
			body: [],
		},
	},
	{
		title: "Analyse",
		description:
			"Hilft uns, die Nutzung der Website zu verstehen und das Erlebnis zu verbessern.",
		linkedCategory: "analytics",
		cookieTable: {
			headers: { name: "Name", domain: "Domain", desc: "Beschreibung" },
			body: [],
		},
	},
];

const sectionsByLang: Record<string, CookieConsent.Section[]> = {
	en: sectionsEN,
	de: sectionsDE,
};

/** Per-language default fallback when the Sanity `sections` JSON is missing or unparseable. */
export function defaultSectionsFor(
	locale?: string | null,
): CookieConsent.Section[] {
	if (typeof locale === "string" && locale in sectionsByLang) {
		return sectionsByLang[locale];
	}
	return sectionsEN;
}
