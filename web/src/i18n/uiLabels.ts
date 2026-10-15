/**
 * Fixed UI copy that is not authored in Sanity: the skip link, landmark and control
 * `aria-label`s, the error boundaries, the 404 fallback (when `errorSettings` has no text), the
 * content-refs controls and label fallbacks. Add a locale here when you add one in
 * `siteLanguageSettings`. A regional locale uses its base language (`de-CH` → `de`); unknown
 * locales fall back to English.
 */

type UiLabels = {
	skipToMain: string;
	mainNav: string;
	footer: string;
	language: string;
	colorScheme: string;
	themeLight: string;
	themeDark: string;
	menuOpen: string;
	menuClose: string;
	carouselPrev: string;
	carouselNext: string;
	/** `{n}` is replaced with the 1-based slide number. */
	carouselGoTo: string;
	/** `{n}` is replaced with the 1-based slide number. */
	carouselShow: string;
	soundOn: string;
	soundOff: string;
	errorTitle: string;
	errorBody: string;
	retry: string;
	notFoundTitle: string;
	notFoundBody: string;
	backHome: string;
	filterByCategory: string;
	filterAll: string;
	sortProjects: string;
	sortNewest: string;
	sortAz: string;
	noItems: string;
	/** Card label when a page or project has neither title nor slug. */
	untitled: string;
	/** Link label when a link has no title and nothing to derive one from. */
	link: string;
};

export type UiLabelKey = keyof UiLabels;

/** `de-CH` → `de`: a regional locale without its own labels uses its language's. */
export function baseLanguage(locale: string): string {
	return locale.split("-")[0] ?? locale;
}

const LABELS: Record<string, UiLabels> & { en: UiLabels } = {
	de: {
		skipToMain: "Zum Hauptinhalt springen",
		mainNav: "Hauptnavigation",
		footer: "Fußzeile",
		language: "Sprache",
		colorScheme: "Farbschema",
		themeLight: "Hell",
		themeDark: "Dunkel",
		menuOpen: "Menü öffnen",
		menuClose: "Menü schließen",
		carouselPrev: "Vorherige Folie",
		carouselNext: "Nächste Folie",
		carouselGoTo: "Zu Folie {n}",
		carouselShow: "Folie {n} anzeigen",
		soundOn: "Ton einschalten",
		soundOff: "Ton ausschalten",
		errorTitle: "Etwas ist schiefgelaufen",
		errorBody:
			"Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.",
		retry: "Erneut versuchen",
		notFoundTitle: "Seite nicht gefunden",
		notFoundBody: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
		backHome: "Zur Startseite",
		filterByCategory: "Nach Kategorie filtern",
		filterAll: "Alle",
		sortProjects: "Projekte sortieren",
		sortNewest: "Neueste",
		sortAz: "A–Z",
		noItems: "Keine Einträge vorhanden.",
		untitled: "Ohne Titel",
		link: "Link",
	},
	en: {
		skipToMain: "Skip to main content",
		mainNav: "Main",
		footer: "Footer",
		language: "Language",
		colorScheme: "Color scheme",
		themeLight: "Light",
		themeDark: "Dark",
		menuOpen: "Open menu",
		menuClose: "Close menu",
		carouselPrev: "Previous slide",
		carouselNext: "Next slide",
		carouselGoTo: "Go to slide {n}",
		carouselShow: "Show slide {n}",
		soundOn: "Turn sound on",
		soundOff: "Turn sound off",
		errorTitle: "Something went wrong",
		errorBody: "An unexpected error occurred. Please try again.",
		retry: "Try again",
		notFoundTitle: "Page not found",
		notFoundBody:
			"The page you are looking for does not exist or has been moved.",
		backHome: "Back to home",
		filterByCategory: "Filter by category",
		filterAll: "All",
		sortProjects: "Sort projects",
		sortNewest: "Newest",
		sortAz: "A–Z",
		noItems: "No items to show.",
		untitled: "Untitled",
		link: "Link",
	},
	fr: {
		skipToMain: "Aller au contenu principal",
		mainNav: "Navigation principale",
		footer: "Pied de page",
		language: "Langue",
		colorScheme: "Thème de couleurs",
		themeLight: "Clair",
		themeDark: "Sombre",
		menuOpen: "Ouvrir le menu",
		menuClose: "Fermer le menu",
		carouselPrev: "Diapositive précédente",
		carouselNext: "Diapositive suivante",
		carouselGoTo: "Aller à la diapositive {n}",
		carouselShow: "Afficher la diapositive {n}",
		soundOn: "Activer le son",
		soundOff: "Couper le son",
		errorTitle: "Une erreur s’est produite",
		errorBody: "Une erreur inattendue est survenue. Veuillez réessayer.",
		retry: "Réessayer",
		notFoundTitle: "Page introuvable",
		notFoundBody: "La page que vous cherchez n’existe pas ou a été déplacée.",
		backHome: "Retour à l’accueil",
		filterByCategory: "Filtrer par catégorie",
		filterAll: "Tout",
		sortProjects: "Trier les projets",
		sortNewest: "Plus récents",
		sortAz: "A–Z",
		noItems: "Aucun élément à afficher.",
		untitled: "Sans titre",
		link: "Lien",
	},
	nl: {
		skipToMain: "Ga naar hoofdinhoud",
		mainNav: "Hoofdnavigatie",
		footer: "Voettekst",
		language: "Taal",
		colorScheme: "Kleurenschema",
		themeLight: "Licht",
		themeDark: "Donker",
		menuOpen: "Menu openen",
		menuClose: "Menu sluiten",
		carouselPrev: "Vorige dia",
		carouselNext: "Volgende dia",
		carouselGoTo: "Ga naar dia {n}",
		carouselShow: "Dia {n} tonen",
		soundOn: "Geluid aanzetten",
		soundOff: "Geluid uitzetten",
		errorTitle: "Er is iets misgegaan",
		errorBody: "Er is een onverwachte fout opgetreden. Probeer het opnieuw.",
		retry: "Opnieuw proberen",
		notFoundTitle: "Pagina niet gevonden",
		notFoundBody: "De pagina die je zoekt bestaat niet of is verplaatst.",
		backHome: "Terug naar home",
		filterByCategory: "Filteren op categorie",
		filterAll: "Alle",
		sortProjects: "Projecten sorteren",
		sortNewest: "Nieuwste",
		sortAz: "A–Z",
		noItems: "Geen items om te tonen.",
		untitled: "Zonder titel",
		link: "Link",
	},
};

/** Localized fixed UI label; `vars` fills `{name}` placeholders (e.g. `{ n: 2 }`). */
export function uiLabel(
	key: UiLabelKey,
	locale: string,
	vars?: Record<string, string | number>,
): string {
	const text = (LABELS[locale] ?? LABELS[baseLanguage(locale)] ?? LABELS.en)[
		key
	];
	if (!vars) return text;
	return text.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in vars ? String(vars[name]) : match,
	);
}
