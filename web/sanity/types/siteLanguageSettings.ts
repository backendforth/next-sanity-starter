export type SiteLanguageSettingsDocument = {
	_id: string;
	availableLanguages?: Array<{ id?: string; title?: string }> | null;
	defaultLanguageId?: string | null;
};
