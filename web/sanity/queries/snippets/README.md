# Query snippets (`snippets/`)

Small **GROQ fragments** you compose into larger queries, plus the full queries for the app shell and the sitemap. A fragment is not runnable alone unless wrapped in a full GROQ expression (e.g. `*[_type == "x"][0]{ ... }`).

Import a fragment from its file (`@/sanity/queries/snippets/link`); `@/sanity/queries` exports only the full queries (see `queries/index.ts`).

## Contents

| File | Export(s) | Role |
|------|-----------|------|
| `seo.ts` | `pageSeoQuery` | **`pageSeoQuery`** — `seo { … }` projection for any document with a local `seo` field (home, `page`, `siteSettings`); `image` uses `imageQuery`. Route metadata takes the site-wide fallback from `siteChromeQuery` (`settings.seo`) instead of an embedded join. |
| `media.ts` | `imageQuery`, `videoQuery` | Image / Mux shapes, one per field type (`field${imageQuery}`, `field${videoQuery}`) |
| `link.ts` | `linkQuery` | `link` marks and nav rows, one `select` branch per type (`linkType` tells them apart): `internal` (`resolvedReference { _id, _type, title, path }`), `external` (`url`, `blank`), `function` (`func.key` / `func.params` per `linkFunctions`) |
| `routePath.ts` | `routePathProjection` | The site path of a routable document (`/`, `/work`, `/{slug}`, `/work/{slug}`), `null` when it has no route. Used by `linkQuery`, `contentRefs`, `translationsQuery`, the sitemap and the four page queries; the web turns it into an href with `hrefFor(path, locale)` (`siteLocalePathUtils.ts`) |
| `settings.ts` | `siteChromeQuery`, `siteLanguageSettingsQuery` | `siteChromeQuery` is the whole app shell of one language in one fetch (`fetchSiteChrome(locale)`): nav menus, cookie banner, site settings (title, SEO fallback, the default language's favicon), analytics and the 404 copy. `siteLanguageSettingsQuery` drives routing (`fetchSiteLanguageSettings`). Per-language documents select with `language == $locale`; `siteLanguageSettings` and `siteAnalyticsSettings` are global singletons (`_type` + `_id`) |
| `translations.ts` | `translationsQuery` | `translations` = every published language variant (`page`/`project` via `translation.metadata`, `home`/`work` by type) with its `path`, for `hreflang` and the language switch |
| `sitemap.ts` | `pageSlugsQuery`, `projectSlugsQuery`, `sitemapPagesQuery` | Slug + `language` rows for the `[slug]` and `work/[slug]` routes (`generateStaticParams`, all languages); sitemap rows: `home`, `work`, every `page` and `project` with `language`, unprefixed `path`, `translations` and `_updatedAt` |

## Composing a query

Interpolate fragments into your own projection and wrap the full query in `defineQuery` — `../pages/home.ts` is the pattern. Use `imageQuery` / `videoQuery` per field (`"cover": cover${imageQuery}`) for consistent asset metadata (dimensions, playback ids, Studio poster frame).

Fragments are plain `const` template strings; a function call anywhere in the chain keeps TypeGen from typing the query (`pnpm generate` fails on it). The route then reads the query through a fetcher in `fetchSanityData.ts`, never through `client.fetch` in a component.

## The shell bundle

**`siteChromeQuery`** — the app shell of one language in one fetch: `siteNav` for `$locale` with resolved main + footer menus, the cookie banner copy (the default language's when `$locale` has none, so consent is always asked), site settings (brand title, SEO fallback; the favicon from the default language), analytics and the 404 copy (`notFound`). The layout, every `generateMetadata` and the 404 pages read it through `fetchSiteChrome(locale)`.

Its members (`siteNavQuery`, `siteSettingsQuery`, `siteCookieBannerQuery`, …) are unexported, field-scoped fragments in `settings.ts` — compose from them and `linkQuery` if you need a custom shape.

## Related

- **Components:** `queries/components/` — `modules/` (`modulesQuery`), `text/richTextMedia.ts` (`richTextMediaQuery`). See `queries/components/README.md`.
- **Pages:** `queries/pages/` — full document queries for routes.
