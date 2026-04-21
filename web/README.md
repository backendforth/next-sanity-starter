# Next.js app (`web/`)

Copy **`.env.example`** to **`.env.local`** and set at least `SANITY_STUDIO_PROJECT_ID` (same values as `studio/.env`). For **Sanity Presentation / Visual Editing**, also set **`SANITY_API_READ_TOKEN`**, **`SANITY_STUDIO_PREVIEW_ORIGIN`**, and (Studio) **`SANITY_STUDIO_WEB_PREVIEW_ORIGINS`** when the iframe is not localhost — see **`sanity/README.md`** (*Presentation & Visual Editing*).

From the monorepo root:

```bash
pnpm web:dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Languages (default vs fallback, URL prefixes)

**Single source (Next + Studio):** [`packages/languages/src/index.ts`](../packages/languages/src/index.ts) — package **`@repo/languages`**. Web re-exports via [`src/i18n/site-locales.ts`](./src/i18n/site-locales.ts); see [`src/i18n/README.md`](./src/i18n/README.md). Why not root `.env`? [packages/languages/README.md](../packages/languages/README.md).

| What | Where |
|------|--------|
| Supported languages | `SITE_LOCALES` in `packages/languages` — order = fallback order in `sanityLocalizedText`. |
| **Default** (no URL prefix) | `SITE_DEFAULT_LOCALE` — must be in `SITE_LOCALES`. |
| Studio UI labels | `SITE_LOCALE_LABELS` in `packages/languages` — one title per id. |
| Fallback when a Sanity field has no translation | Same as `SITE_LOCALES` order (after exact / base tags). |

### Switch **English** as default (current setup)

```ts
// packages/languages/src/index.ts
export const SITE_LOCALES = ["en", "de"] as const;
export const SITE_DEFAULT_LOCALE: SiteLocaleCode = "en";
```

- URLs: `/`, `/about` → English. German: `/de`, `/de/about`.
- **Reserved path segment:** `de` (do not use `de` as a page slug on the English site).

### Switch **German** as default

```ts
// packages/languages/src/index.ts
export const SITE_LOCALES = ["de", "en"] as const;
export const SITE_DEFAULT_LOCALE: SiteLocaleCode = "de";
```

- URLs: `/`, `/about` → German. English: `/en`, `/en/about`.
- **Reserved path segment:** `en`.

After changing `packages/languages`, restart **web** and **studio** dev servers. Routing uses [`src/proxy.ts`](./src/proxy.ts); helpers [`src/i18n/paths.ts`](./src/i18n/paths.ts) (`localePath`) for links.

### Add another language (e.g. French)

1. In `packages/languages/src/index.ts`: append `"fr"` to `SITE_LOCALES`, add `fr: "Français"` to `SITE_LOCALE_LABELS`.
2. Content: fill `fr` entries in Studio internationalized fields.
3. URLs become `/fr`, `/fr/about`, … (each non-default locale gets a prefix; avoid using that segment as a slug for the default locale).

---

## Build / routing (reference)

From `pnpm run build` (Next.js 16): routes are labeled **Static** (○), **SSG** (● `generateStaticParams`), or **Dynamic** (ƒ). Example output:

| Route | Mode |
|-------|------|
| `/[locale]/[slug]` | SSG (●) |
| `/[locale]` | Dynamic (ƒ) — home |
| `/_not-found` | Static (○) after moving shell out of root `headers()` |
| `/api/revalidate` | Dynamic |
| `/robots.txt`, `/sitemap.xml` | Static |

Re-run `pnpm run build` after changes; optional bundle analysis: `@next/bundle-analyzer` (one-off).

**CDN caching:** Prefer your host’s defaults for `/_next/static` (e.g. Vercel sets long-lived cache for hashed assets). Custom `Cache-Control` in `next.config` is omitted here — Next warns it can interfere with dev/build tooling.

**Next 16 (optional):** [`cacheComponents`](https://nextjs.org/blog/next-16) and `"use cache"` / `cacheLife` give more explicit server caching — larger migration than this boilerplate assumes.

**Fonts:** `src/app/layout.tsx` contains commented `next/font/local` instructions — enable when `src/assets/fonts/` has `.woff2` files for better LCP/CLS.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- App layout and routes live under `src/app/` (see `[locale]` segments).
