# Next.js app (`web/`)

Copy **`.env.example`** to **`.env.local`** and set at least `SANITY_STUDIO_PROJECT_ID` (same values as `studio/.env`). See `sanity/README.md` for the Sanity data layer.

From the monorepo root:

```bash
pnpm web:dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Languages (default vs fallback, URL prefixes)

**One file to edit:** [`src/i18n/site-locales.ts`](./src/i18n/site-locales.ts) — see [`src/i18n/README.md`](./src/i18n/README.md) for how each file in `i18n/` fits together.

| What | Where |
|------|--------|
| Supported languages | `SITE_LOCALES` — list every locale code (`"en"`, `"de"`, …). |
| **Default** (no URL prefix) | `SITE_DEFAULT_LOCALE` — must be one entry in `SITE_LOCALES`. |
| Fallback when a Sanity field has no translation | Same list order: after the exact / base tag, other entries in `SITE_LOCALES` are tried (see `sanity/utils/sanityLocalizedText.ts`). |

### Switch **English** as default (current setup)

```ts
export const SITE_LOCALES = ["en", "de"] as const;
export const SITE_DEFAULT_LOCALE: SiteLocaleCode = "en";
```

- URLs: `/`, `/about` → English. German: `/de`, `/de/about`.
- **Reserved path segment:** `de` (do not use `de` as a page slug on the English site).

### Switch **German** as default

```ts
export const SITE_LOCALES = ["de", "en"] as const;
export const SITE_DEFAULT_LOCALE: SiteLocaleCode = "de";
```

- URLs: `/`, `/about` → German. English: `/en`, `/en/about`.
- **Reserved path segment:** `en`.

After changing `site-locales.ts`, restart the dev server. Routing uses [`src/middleware.ts`](./src/middleware.ts); helpers [`src/i18n/paths.ts`](./src/i18n/paths.ts) (`localePath`) for links.

### Add another language (e.g. French)

1. Append `"fr"` to `SITE_LOCALES` (and keep `SITE_DEFAULT_LOCALE` in that list).
2. Add `fr` / `fr-FR` in Sanity for internationalized fields so content can be filled.
3. URLs become `/fr`, `/fr/about`, … (each non-default locale gets a prefix; avoid using that segment as a slug for the default locale).

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- App layout and routes live under `src/app/` (see `[locale]` segments).
