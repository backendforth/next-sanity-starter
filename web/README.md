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
| Studio languages for `@sanity/document-internationalization` | Same document, read draft first (see `studio/config/sync/supportedLanguages.ts`); reload the Studio after changing languages. |
| Content in a language | One Sanity document per language. Queries select it with `language == $locale`; a missing translation is not filled from another language (slug routes 404). |

If the singleton is missing or lists no language ids, the web app falls back to **en** only (see `web/src/i18n/fallbackSiteLocales.ts`). Partial data degrades per row instead: a language without a label uses its id, and a `defaultLanguageId` that isn't in the list falls back to the first language (`sanity/normalizeSiteLocaleConfig.ts`). **Publish** `siteLanguageSettings` so the CDN sees it, or set **`SANITY_API_READ_TOKEN`** in `web/.env.local` so dev reads drafts (same as Presentation). Studio needs no token: it reads the draft first through the editor's session.

**Reserved path segments:** every **non-default** language `id` is a first path segment (for example `de` in `/de/about`). Do not use those strings as page slugs on the default-locale site.

**Routing:** [`src/proxy.ts`](./src/proxy.ts) reads locales from the Sanity CDN (cached). Client links use [`LanguageContext`](./src/contexts/LanguageContext.tsx) (`localePath`, etc.). Slugs differ per language, so each route page renders [`LocaleAlternates`](./src/components/navigation/LocaleAlternates.tsx) with its `translations`; the language switch follows those instead of swapping the URL prefix.

---

## Freshness (how published content reaches visitors)

Routes are static (`generateStaticParams`) and every `sanityFetch` result is cached with cache tags from `sanity/cacheTags.ts`. What expires them depends on `SANITY_REVALIDATE_SECRET`:

| | Webhook configured (secret set, Sanity webhook → `/api/revalidate`) | No webhook |
|---|---|---|
| On publish | `/api/revalidate` expires the matching tags; the next request renders fresh. | `<SanityLive />` runs for every visitor and revalidates the tags of each publish event while a tab is open. |
| Time-based fallback | None — caches live until a tag expires. | 60 s: the published `unstable_cache` reads (`cachedSanityQuery.ts`) cap the ISR period of every route, so a page published while nobody had the site open is at most a minute stale. |
| `<SanityLive />` | Draft Mode / Presentation only. | Everyone. No token needed for published content. |

Routes don't export `revalidate`; the table above is the whole story.

## Build / routing (reference)

From `pnpm run build` (Next.js 16): routes are labeled **Static** (○), **SSG** (● `generateStaticParams`), or **Dynamic** (ƒ). Example output:

(Your tree may differ once you add routes.)

---

## More docs

- [`sanity/README.md`](./sanity/README.md) — GROQ, fetch, Presentation, localization utilities.
- [`src/i18n/README.md`](./src/i18n/README.md) — locale routing flow.
