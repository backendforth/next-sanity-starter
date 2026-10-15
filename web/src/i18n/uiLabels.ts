/**
 * Fixed UI copy that is not authored in Sanity: landmark and control `aria-label`s, the error
 * boundary, the 404 fallback (when `errorSettings` has no text), the content-refs controls and
 * the cookie banner's defaults (for every text `siteCookieBanner` leaves empty).
 * Same shape as `skipLinkLabel.ts`; add a locale here when you add one in `siteLanguageSettings`.
 * Unknown locales fall back to English.
 */

type UiLabels = {
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
	cookieConsentDescription: string;
	cookieAccept: string;
	cookieReject: string;
	cookieManagePreferences: string;
	cookiePrivacyPolicy: string;
	cookiePreferencesTitle: string;
	cookieAcceptAll: string;
	cookieRejectAll: string;
	cookieSavePreferences: string;
	cookieNecessaryTitle: string;
	cookieNecessaryDescription: string;
	cookieAnalyticsTitle: string;
	cookieAnalyticsDescription: string;
	cookieTableName: string;
	cookieTableDomain: string;
	cookieTableDescription: string;
	/** Row text for a tracker without a cookie banner description. */
	cookieTrackerDescription: string;
	/** Appended in brackets to a cookie-free tracker's row. */
	cookieFreeNote: string;
};

export type UiLabelKey = keyof UiLabels;

const LABELS: Record<string, UiLabels> & { en: UiLabels } = {
	de: {
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
		cookieConsentDescription:
			"Unsere Website verwendet notwendige Cookies für den Grundbetrieb. Analysen mit Cookies laufen erst, nachdem du zugestimmt hast; datenschutzfreundliche Analysen ohne Cookies können schon vorher laden.",
		cookieAccept: "Akzeptieren",
		cookieReject: "Ablehnen",
		cookieManagePreferences: "Einstellungen verwalten",
		cookiePrivacyPolicy: "Datenschutzerklärung",
		cookiePreferencesTitle: "Cookie-Einstellungen",
		cookieAcceptAll: "Alle akzeptieren",
		cookieRejectAll: "Alle ablehnen",
		cookieSavePreferences: "Einstellungen speichern",
		cookieNecessaryTitle: "Unbedingt erforderlich",
		cookieNecessaryDescription:
			"Notwendig für den grundlegenden Betrieb der Website und nicht deaktivierbar.",
		cookieAnalyticsTitle: "Analyse",
		cookieAnalyticsDescription:
			"Hilft uns, die Nutzung der Website zu verstehen und das Erlebnis zu verbessern.",
		cookieTableName: "Name",
		cookieTableDomain: "Domain",
		cookieTableDescription: "Beschreibung",
		cookieTrackerDescription: "In Sanity eingerichteter Analyse-Anbieter.",
		cookieFreeNote: "ohne Cookies — lädt ohne Einwilligung in Analysen",
	},
	en: {
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
		cookieConsentDescription:
			"Our website uses essential cookies for basic operation. Cookie-based analytics run only after you accept them; privacy-friendly analytics without cookies may load earlier.",
		cookieAccept: "Accept",
		cookieReject: "Reject",
		cookieManagePreferences: "Manage preferences",
		cookiePrivacyPolicy: "Privacy policy",
		cookiePreferencesTitle: "Cookie preferences",
		cookieAcceptAll: "Accept all",
		cookieRejectAll: "Reject all",
		cookieSavePreferences: "Save preferences",
		cookieNecessaryTitle: "Strictly Necessary",
		cookieNecessaryDescription:
			"Essential for basic website functionality and cannot be disabled.",
		cookieAnalyticsTitle: "Analytics",
		cookieAnalyticsDescription:
			"Helps us understand usage patterns and improve the website experience.",
		cookieTableName: "Name",
		cookieTableDomain: "Domain",
		cookieTableDescription: "Description",
		cookieTrackerDescription: "Analytics provider configured in Sanity.",
		cookieFreeNote: "cookie-free — loads without analytics consent",
	},
	fr: {
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
		cookieConsentDescription:
			"Notre site utilise des cookies essentiels à son fonctionnement. La mesure d’audience avec cookies ne démarre qu’après votre accord ; une mesure respectueuse de la vie privée, sans cookies, peut se charger avant.",
		cookieAccept: "Accepter",
		cookieReject: "Refuser",
		cookieManagePreferences: "Gérer les préférences",
		cookiePrivacyPolicy: "Politique de confidentialité",
		cookiePreferencesTitle: "Préférences de cookies",
		cookieAcceptAll: "Tout accepter",
		cookieRejectAll: "Tout refuser",
		cookieSavePreferences: "Enregistrer les préférences",
		cookieNecessaryTitle: "Strictement nécessaires",
		cookieNecessaryDescription:
			"Indispensables au fonctionnement de base du site, ils ne peuvent pas être désactivés.",
		cookieAnalyticsTitle: "Mesure d’audience",
		cookieAnalyticsDescription:
			"Nous aide à comprendre l’utilisation du site et à l’améliorer.",
		cookieTableName: "Nom",
		cookieTableDomain: "Domaine",
		cookieTableDescription: "Description",
		cookieTrackerDescription:
			"Outil de mesure d’audience configuré dans Sanity.",
		cookieFreeNote: "sans cookies — se charge sans consentement à la mesure",
	},
	nl: {
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
		cookieConsentDescription:
			"Onze website gebruikt essentiële cookies voor de basiswerking. Analyse met cookies start pas nadat je die accepteert; privacyvriendelijke analyse zonder cookies kan eerder laden.",
		cookieAccept: "Accepteren",
		cookieReject: "Weigeren",
		cookieManagePreferences: "Voorkeuren beheren",
		cookiePrivacyPolicy: "Privacybeleid",
		cookiePreferencesTitle: "Cookievoorkeuren",
		cookieAcceptAll: "Alles accepteren",
		cookieRejectAll: "Alles weigeren",
		cookieSavePreferences: "Voorkeuren opslaan",
		cookieNecessaryTitle: "Strikt noodzakelijk",
		cookieNecessaryDescription:
			"Onmisbaar voor de basiswerking van de website en niet uit te schakelen.",
		cookieAnalyticsTitle: "Analyse",
		cookieAnalyticsDescription:
			"Helpt ons te begrijpen hoe de website wordt gebruikt en de ervaring te verbeteren.",
		cookieTableName: "Naam",
		cookieTableDomain: "Domein",
		cookieTableDescription: "Beschrijving",
		cookieTrackerDescription: "In Sanity ingestelde analyseprovider.",
		cookieFreeNote: "zonder cookies — laadt zonder toestemming voor analyse",
	},
};

/** Localized fixed UI label; `vars` fills `{name}` placeholders (e.g. `{ n: 2 }`). */
export function uiLabel(
	key: UiLabelKey,
	locale: string,
	vars?: Record<string, string | number>,
): string {
	const text = (LABELS[locale] ?? LABELS.en)[key];
	if (!vars) return text;
	return text.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in vars ? String(vars[name]) : match,
	);
}
