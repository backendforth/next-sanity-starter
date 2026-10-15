# web/sanity/ — Claude Code subtree rules

Canonical: @../../AGENTS.md — §"Sanity data types (TypeGen) and stega" and Cookbook → "Add a GROQ query". Deep docs: [README.md](README.md), [queries/README.md](queries/README.md).

- i18n: document-level — select per-language documents with `language == $locale`; every top-level query for a type in `TRANSLATABLE_SCHEMA_TYPES` takes `$locale`, only `siteLanguageSettings` / `siteAnalyticsSettings` go by `_id`. Project content fields as plain values. `utils/sanityLocalizedText.ts` is only for link labels that arrive as arrays (`utils/resolveLinkLabel.ts`).
- Routes fetch through `fetchSanityData.ts`. Its wrappers take primitive arguments only, so `generateMetadata` and the page share one React `cache` entry.
- `cachedSanityQuery.ts` is for published-only reads without a request scope (sitemap, `generateStaticParams`, language settings) — never for routes that need Draft Mode or Presentation.
