# Query snippets (`snippets/`)

Small **GROQ string snippets** you compose into larger queries. They are not runnable alone unless wrapped in a full GROQ expression (e.g. `*[_type == "x"][0]{ ... }`).

Exports are re-exported from `@/sanity/queries` (see `queries/index.ts`).

## Contents

| File | Export(s) | Role |
|------|-----------|------|
| `seo.ts` | `pageSeoQuery` | **`pageSeoQuery`** — `seo { … }` projection for any document with a local `seo` field (home, `page`, `siteSettings`). Route metadata takes the site-wide fallback from `siteChromeQuery` (`settings.seo`) instead of an embedded join. |
| `media.ts` | `imageQuery`, `videoQuery`, `mediaQuery`, `mediaQuerySpread` | Image / Mux shapes; `mediaQuery` for keyed values, `mediaQuerySpread` inside `image{ … }` / `video{ … }` (GROQ requires spread there) |
| `link.ts` | `linkQuery` | `link` marks and nav rows, one `select` branch per type (`linkType` tells them apart): `internal` (`resolvedReference { _id, _type, title, path }`), `external` (url/href, blank), `function` (`func.key` / `func.params` per `linkFunctions`) |
| `routePath.ts` | `routePathProjection` | The site path of a routable document (`/`, `/work`, `/{slug}`, `/work/{slug}`), `null` when it has no route. Used by `linkQuery`, `contentRefs`, `translationsQuery`, the sitemap and the four page queries; the web turns it into an href with `hrefFor(path, locale)` (`siteLocalePathUtils.ts`) |
| `settings.ts` | `siteChromeQuery`, `siteLanguageSettingsQuery` | `siteChromeQuery` is the whole app shell of one language in one fetch (`fetchSiteChrome(locale)`): nav menus, cookie banner, site settings (title, SEO fallback, the default language's favicon), analytics and the 404 copy. `siteLanguageSettingsQuery` drives routing (`fetchSiteLanguageSettings`). Per-language documents select with `language == $locale`; `siteLanguageSettings` and `siteAnalyticsSettings` are global singletons (`_type` + `_id`) |
| `translations.ts` | `translationsQuery` | `translations` = every published language variant (`page`/`project` via `translation.metadata`, `home`/`work` by type) with its `path`, for `hreflang` and the language switch |
| `sitemap.ts` | `pageSlugsQuery`, `projectSlugsQuery`, `sitemapPagesQuery` | Slug + `language` rows for `[slug]` / `work/[slug]` routes (all languages); sitemap rows cover `home`, `work`, `page`, `project` with `language`, unprefixed `path`, `translations` and `_updatedAt` |

## Using a snippet in a custom query (Next.js)

Import the snippet and **interpolate** it into your own GROQ string (same pattern as `queries/pages/home.ts`).

```ts
// app/example/example-query.ts
import { defineQuery } from "next-sanity";
import { linkQuery } from "@/sanity/queries";
import { client } from "@/sanity/client";

const myPortableTextField = `body[]{
  ...,
  markDefs[]{
    ...,
    _type == "link" => { ${linkQuery} }
  }
}`;

export const myQuery = defineQuery(`*[_type == "article" && slug.current == $slug && language == $locale][0]{
  _id,
  title,
  ${myPortableTextField}
}`);

// Server Component or route handler — `locale` comes from the route params; `doc` is typed by `pnpm generate`
const doc = await client.fetch(myQuery, { slug: "hello", locale });
```

Fragments are plain `const` template strings and the full query goes through `defineQuery`; a function call anywhere in the chain keeps TypeGen from typing the query (`pnpm generate` fails on it).

Use `imageQuery` / `videoQuery` inside object projections when you need consistent asset metadata (dimensions, playback ids, Studio poster frame).

## Settings documents

Settings are per-language documents (one `siteNav`, `siteSettings`, … per language), so the queries below take `$locale`.

- **`siteChromeQuery`** — `siteNav` for `$locale` with resolved main + footer menus (falls back to a legacy `siteNav` without `language`), the cookie banner copy, site settings, analytics and the 404 copy in one fetch (no `modules[]` anywhere: no error page renders modules).

Settings queries stay **field-scoped on purpose**: every embedded `modulesQuery` costs ~77 KB of GROQ text per query (POSTed on each fetch — see `components/README.md`). Earlier full-document variants (`siteSettingsQuery`, `siteNavQuery`, `siteCookieBannerQuery`, `settingsBundleQuery`) were removed for exactly that reason — compose from the fragments in `settings.ts` and `linkQuery` instead if you need a custom shape.

Example:

```ts
import { siteChromeQuery } from "@/sanity/queries";
import { client } from "@/sanity/client";

const chrome = await client.fetch(siteChromeQuery, { locale });
const footerLinks = chrome.nav?.footerMenu ?? [];
```

## Using snippets with a client-side store

Snippets are just strings — the **store** should hold **fetch results**, not the snippet definitions.

1. **Server-first (recommended):** fetch in a Server Component or Route Handler with `client.fetch(query, params)`, pass data as props or serialize for the client.
2. **Client store (e.g. Zustand):** after fetching (from a Route Handler, Server Action, or client `fetch` to an API route that runs GROQ), put the **parsed JSON** in the store.

Example pattern with a small API route that wraps a snippet-based query:

```ts
// app/api/site-shell/[locale]/route.ts
import { siteChromeQuery } from "@/sanity/queries";
import { client } from "@/sanity/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const data = await client.fetch(siteChromeQuery, { locale });
  return Response.json(data);
}
```

```ts
// store/site-shell.ts (client)
import { create } from "zustand";

type SiteShell = Awaited<ReturnType<typeof fetchSiteShell>>;

async function fetchSiteShell(locale: string) {
  const res = await fetch(`/api/site-shell/${locale}`);
  return res.json();
}

export const useSiteShellStore = create<{
  data: SiteShell | null;
  load: (locale: string) => Promise<void>;
}>((set) => ({
  data: null,
  load: async (locale) => {
    const data = await fetchSiteShell(locale);
    set({ data });
  },
}));
```

Avoid exposing the raw Sanity client with **write** tokens to the browser; read-only CDN or a server proxy is the usual pattern.

## Related

- **Components:** `queries/components/` — `modules/` (`modulesQuery`), `text/richTextMedia.ts` (`richTextMediaQuery`). See `queries/components/README.md`.
- **Pages:** `queries/pages/` — full document queries for routes.
