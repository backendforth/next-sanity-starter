/**
 * Aliased to the generated `SiteLanguageSettingsQueryResult` so the shape stays
 * locked to `siteLanguageSettingsQuery` in `sanity/queries/snippets/settings.ts`
 * (typegen reads the Studio schema; drift is caught by the web typegen CI gate).
 *
 * The generated union already includes `null` (single `[0]` document); strip it
 * here so existing consumers can keep the `SiteLanguageSettingsDocument | null`
 * pattern they've always used.
 */
import type { SiteLanguageSettingsQueryResult } from "../sanity.types.gen";

export type SiteLanguageSettingsDocument =
	NonNullable<SiteLanguageSettingsQueryResult>;
