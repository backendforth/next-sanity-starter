export type CookieConsentModalCopy = {
	description?: string | null;
	acceptAllBtn?: string | null;
	acceptNecessaryBtn?: string | null;
	showPreferencesBtn?: string | null;
};

export type CookiePreferencesModalCopy = {
	title?: string | null;
	acceptAllBtn?: string | null;
	acceptNecessaryBtn?: string | null;
	savePreferencesBtn?: string | null;
	/** Stored as JSON string in Sanity (`code` field). Parsed at runtime. */
	sections?: string | null;
};

export type SiteCookieBannerDocument = {
	_id: string;
	useCookieBanner?: boolean | null;
	consentModal?: CookieConsentModalCopy | null;
	preferencesModal?: CookiePreferencesModalCopy | null;
};
