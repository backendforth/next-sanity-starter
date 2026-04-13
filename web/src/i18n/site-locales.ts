/**
 * Re-exports shared language config from `@repo/languages` (monorepo package).
 * Edit languages in **`packages/languages/src/index.ts`** — used by Next.js and Sanity Studio.
 */
export {
	SITE_DEFAULT_LOCALE,
	SITE_LOCALES,
	type SiteLocaleCode,
} from "@repo/languages";
