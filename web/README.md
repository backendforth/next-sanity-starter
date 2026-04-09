# Next.js app (`web/`)

Copy **`.env.example`** to **`.env.local`** and set at least `SANITY_STUDIO_PROJECT_ID` (same values as `studio/.env`). See `sanity/README.md` for the Sanity data layer.

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

After changing `packages/languages`, restart **web** and **studio** dev servers. Routing uses [`src/middleware.ts`](./src/middleware.ts); helpers [`src/i18n/paths.ts`](./src/i18n/paths.ts) (`localePath`) for links.

### Add another language (e.g. French)

1. In `packages/languages/src/index.ts`: append `"fr"` to `SITE_LOCALES`, add `fr: "Français"` to `SITE_LOCALE_LABELS`.
2. Content: fill `fr` entries in Studio internationalized fields.
3. URLs become `/fr`, `/fr/about`, … (each non-default locale gets a prefix; avoid using that segment as a slug for the default locale).

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- App layout and routes live under `src/app/` (see `[locale]` segments).
