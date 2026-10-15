# web/sanity/ — Claude Code subtree rules

Canonical: @../../AGENTS.md — §"Sanity data types (TypeGen) and stega" and Cookbook → "Add a GROQ query". Deep docs: [README.md](README.md), [queries/README.md](queries/README.md).

- i18n: field-level — project full `{ _key, _type, language, value }` arrays, never filter locale in GROQ; `utils/sanityLocalizedText.ts` is the only resolver (extend it, don't fork it).
- Routes fetch through `fetchSanityData.ts`. Its wrappers take primitive arguments only, so `generateMetadata` and the page share one React `cache` entry.
- `cachedSanityQuery.ts` is for published-only reads without a request scope (sitemap, `generateStaticParams`, language settings) — never for routes that need Draft Mode or Presentation.
