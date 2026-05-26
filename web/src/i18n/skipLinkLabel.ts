const SKIP_TO_MAIN: Record<string, string> = {
	de: "Zum Hauptinhalt springen",
	en: "Skip to main content",
	fr: "Aller au contenu principal",
	nl: "Ga naar hoofdinhoud",
};

/** Localized skip-link label; falls back to English when locale is unknown. */
export function skipLinkLabel(locale: string): string {
	return SKIP_TO_MAIN[locale] ?? SKIP_TO_MAIN.en;
}
