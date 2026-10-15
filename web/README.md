# Next.js app (`web/`)

Copy **`.env.example`** to **`.env.local`** and set at least `SANITY_STUDIO_PROJECT_ID` (same values as `studio/.env`). For **Sanity Presentation / Visual Editing**, also set **`SANITY_API_READ_TOKEN`** here, and in `studio/.env` **`SANITY_STUDIO_PREVIEW_ORIGIN`** (plus **`SANITY_STUDIO_WEB_PREVIEW_ORIGINS`** when the iframe is not localhost) — see **`sanity/README.md`** (*Presentation & Visual Editing*).

From the monorepo root:

```bash
pnpm web:dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm web:dev` runs **`next dev`** on Turbopack, the same bundler as `next build`. If Turbopack panics, `cd web && pnpm exec next dev --webpack` is the fallback.

---

## Languages (Sanity `siteLanguageSettings`)

**Source of truth:** the **`siteLanguageSettings`** document in Sanity (**Settings → Site languages**): ordered `availableLanguages` (`id` + `title`) and **`defaultLanguageId`**.

| What | Where |
|------|-------|
| Supported languages | Sanity **Site languages** — order = fallback order in `sanity/utils/sanityLocalizedText.ts`. |
| **Default** (no URL prefix) | **`defaultLanguageId`** in that document. |
| Studio UI labels for `internationalizedArray*` | Same document; Studio loads them at runtime from Sanity (see `studio/config/sync/internationalizedArrayLanguages.ts`). |
| Fallback when a field has no translation | Same order as `availableLanguages` (after exact / base tags). |

If the singleton is missing or lists no language ids, the web app falls back to **en** only (see `web/src/i18n/fallbackSiteLocales.ts`). Partial data degrades per row instead: a language without a label uses its id, and a `defaultLanguageId` that isn't in the list falls back to the first language (`sanity/normalizeSiteLocaleConfig.ts`). **Publish** `siteLanguageSettings` so the CDN sees it, or set **`SANITY_API_READ_TOKEN`** in `web/.env.local` so dev reads drafts (same as Presentation). Studio needs no token: it reads the draft first through the editor's session.

**Reserved path segments:** every **non-default** language `id` is a first path segment (for example `de` in `/de/about`). Do not use those strings as page slugs on the default-locale site.

**Routing:** [`src/proxy.ts`](./src/proxy.ts) reads locales from the Sanity CDN (cached). Client links use [`LanguageContext`](./src/contexts/LanguageContext.tsx) (`localePath`, etc.).

---

## Freshness (how published content reaches visitors)

Routes are static (`generateStaticParams`) and every `sanityFetch` result is cached with cache tags from `sanity/cacheTags.ts`. What expires them depends on `SANITY_REVALIDATE_SECRET`:

| | Webhook configured (secret set, Sanity webhook → `/api/revalidate`) | No webhook |
|---|---|---|
| On publish | `/api/revalidate` expires the matching tags; the next request renders fresh. | `<SanityLive />` runs for every visitor and revalidates the tags of each publish event while a tab is open. |
| Time-based fallback | None — caches live until a tag expires. | 60 s for the `cachedSanityQuery.ts` reads only (language settings, slug lists, sitemap). Page content has none: next-sanity caches every `sanityFetch` without a time limit, so a publish while no tab is open stays invisible until a later publish event reaches an open tab, or the next deploy. |
| `<SanityLive />` | Draft Mode / Presentation only. | Everyone. No token needed for published content. |

Production needs the webhook; without it freshness depends on visitors. Routes don't export `revalidate`; the table above is the whole story.

## More docs

- [`sanity/README.md`](./sanity/README.md) — GROQ, fetch, Presentation, localization utilities.
- [`src/i18n/README.md`](./src/i18n/README.md) — locale routing flow.
