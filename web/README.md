# Next.js app (`web/`)

Copy **`.env.example`** to **`.env.local`** and set at least `SANITY_STUDIO_PROJECT_ID` (same values as `studio/.env`). For **Sanity Presentation / Visual Editing**, also set **`SANITY_API_READ_TOKEN`**, **`SANITY_STUDIO_PREVIEW_ORIGIN`**, and (Studio) **`SANITY_STUDIO_WEB_PREVIEW_ORIGINS`** when the iframe is not localhost — see **`sanity/README.md`** (*Presentation & Visual Editing*).

From the monorepo root:

```bash
pnpm web:dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm web:dev` runs **`next dev --webpack`** because the default Turbopack dev server can hit internal panics on some setups (Next 16.2). Production **`next build`** is unchanged. To try Turbopack locally: `cd web && pnpm exec next dev --turbopack`.

---

## Languages (Sanity `siteLanguageSettings`)

**Source of truth:** the **`siteLanguageSettings`** document in Sanity (**Settings → Site languages**): ordered `availableLanguages` (`id` + `title`) and **`defaultLanguageId`**.

| What | Where |
|------|-------|
| Supported languages | Sanity **Site languages** — ids are URL segments and the `language` values on translated documents; order = language switcher order. |
| **Default** (no URL prefix) | **`defaultLanguageId`** in that document. |
| Studio languages for `@sanity/document-internationalization` | Same document; Studio fetches it once per session (see `studio/config/sync/supportedLanguages.ts`). |
| Content in a language | One Sanity document per language. Queries select it with `language == $locale`; a missing translation is not filled from another language (slug routes 404). |

If the singleton is missing or invalid, the web app falls back to **en** only (see `web/src/i18n/fallbackSiteLocales.ts`). **Publish** `siteLanguageSettings` so the CDN sees it, or set **`SANITY_API_READ_TOKEN`** in `web/.env.local` so dev reads drafts (same as Presentation). The same token in `studio/.env` lets Studio read draft language settings — see `studio/.env.example`.

**Reserved path segments:** every **non-default** language `id` is a first path segment (for example `de` in `/de/about`). Do not use those strings as page slugs on the default-locale site.

**Routing:** [`src/proxy.ts`](./src/proxy.ts) reads locales from the Sanity CDN (cached). Client links use [`LanguageContext`](./src/contexts/LanguageContext.tsx) (`localePath`, etc.).

---

## Build / routing (reference)

From `pnpm run build` (Next.js 16): routes are labeled **Static** (○), **SSG** (● `generateStaticParams`), or **Dynamic** (ƒ). Example output:

(Your tree may differ once you add routes.)

---

## More docs

- [`sanity/README.md`](./sanity/README.md) — GROQ, fetch, Presentation, localization utilities.
- [`src/i18n/README.md`](./src/i18n/README.md) — locale routing flow.
