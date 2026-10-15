# next-sanity-starter

> A production-shaped starting point for a multi-language, CMS-driven site — **Next.js 16** App Router, **React 19**, **Sanity Studio v6**, with optional **Mux** video and **Netlify** hosting for both the site and the Studio.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![Sanity v6](https://img.shields.io/badge/Sanity-6-f03e2f?logo=sanity&logoColor=white)](https://www.sanity.io)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Biome](https://img.shields.io/badge/Biome-2-60a5fa?logo=biome&logoColor=white)](https://biomejs.dev)
[![License: ISC](https://img.shields.io/badge/license-ISC-green)](LICENSE)

Slim on purpose: no unused features, production-grade defaults, and a short path from `git clone` to the first published page. Documentation lives next to the code it describes; this file is the map.

---

## Two flavours

The starter ships as **two parallel branches**. They share every document type, module, query and component; they differ only in where a translation lives.

| Branch | i18n model | Pick when |
|---|---|---|
| **[`main`](../../tree/main)** | **Field-level** — `sanity-plugin-internationalized-array`. One document per page; every translatable field holds all languages. Resolved at render time. | Translations share one structure: same slug, same modules, language tabs per field. |
| **[`variant/document-level`](../../tree/variant/document-level)** | **Document-level** — `@sanity/document-internationalization`. One document per language, linked as translations; GROQ selects the route's language. | Languages diverge: own slugs, own modules, own SEO per locale. |

The exact differences are listed in [`AGENTS.md`](AGENTS.md) → "Branch-specific notes". Neither branch is a downgrade of the other.

---

## What you get

- **Next.js app** — App Router with locale routing (default locale unprefixed, others under `/<locale>/…`), static routes via `generateStaticParams`, cache tags per document type, Draft Mode + Visual Editing (Presentation, stega, `SanityLive`).
- **Sanity Studio v6** — Structure and Presentation, language tabs driven by the **Site languages** singleton, a production → development dataset clone, Netlify hosting on your own domain (Sanity Hosting stays one command away).
- **Content modules** — every content block is a paired Studio schema + React component, scaffolded and wired by `pnpm gen:module`, checked in CI by `pnpm check:wiring`.
- **Media** — native `<img>` with deterministic Sanity CDN URLs, `srcset`/`sizes`, crop and hotspot, no layout shift. Mux video with the official player (`/lazy`) and a light `hls.js` background loop that respects `prefers-reduced-motion`. Video code loads with the page that has a video; the player and `hls.js` wait until it nears the viewport.
- **Revalidation** — `POST /api/revalidate` verifies Sanity's webhook signature, acts only on allow-listed document types and expires their cache tags immediately. It refuses every request while `SANITY_REVALIDATE_SECRET` is unset.
- **SEO** — `sitemap.ts` with per-locale alternates and `x-default`, canonical + `hreflang` metadata on every route, `robots.ts` that allows crawling only on a production deployment.
- **Security headers** — CSP (with `frame-ancestors` for the Studio), HSTS, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, all from `headers()` in `web/next.config.ts`, so they reach the SSR HTML on any host.
- **Cookie consent and analytics (optional)** — a [`vanilla-cookieconsent`](https://github.com/orestbida/cookieconsent) banner edited in the Studio, plus GA4, Microsoft Clarity, PostHog, Plausible and Matomo, gated by consent. See [Analytics & cookie consent](#analytics--cookie-consent).
- **Typed GROQ** — `sanity typegen` generates result types from the schema; CI fails on an uncommitted diff or a query TypeGen skipped.
- **Tailwind CSS v4** — CSS-first tokens (`@theme`), element defaults in `@layer base`, a manual light/dark toggle (`data-theme` on `<html>`).

---

## Stack at a glance

pnpm workspaces (`pnpm-workspace.yaml`: `web`, `studio`, `packages/*`).

| Package | Path | Role |
|---|---|---|
| **Web** | `web/` | Next.js 16 app: routing, data fetching, rendering |
| **Studio** | `studio/` | Sanity Studio v6: schema, structure, Presentation, migrations |
| `@repo/sanity-dataset-resolve` | `packages/sanity-dataset-resolve/` | Picks the dataset for web and Studio; decides whether a deploy is production |
| `@repo/site-languages` | `packages/site-languages/` | Language fallback, normalizer and query projection shared by web and Studio |
| `@repo/scaffold-module` | `packages/scaffold-module/` | `pnpm gen:module <Name>` |
| `@repo/check-wiring` | `packages/check-wiring/` | `pnpm check:wiring` and `check:typegen` (CI gates) |

---

## Get started

```bash
git clone <your-fork>.git my-site
cd my-site
pnpm install
cp web/.env.example web/.env.local
cp studio/.env.example studio/.env
```

Set `SANITY_STUDIO_PROJECT_ID` in both files (same project). That is the only required value for local development.

Create a `development` dataset in the Sanity project (sanity.io/manage → Datasets, or `pnpm --filter studio exec sanity dataset create development`). Local runs prefer it, so you never edit production while iterating. Without it they fall back to `production`.

```bash
pnpm dev          # web on http://localhost:3000, Studio on http://localhost:3333
```

In the Studio:

1. **Settings → Site languages** — check the languages (pre-filled `en` + `de`, default `en`) and publish.
2. **Home** — add a module and publish.
3. **Pages** — create a page with a slug and publish.

Open `http://localhost:3000/<slug>` for the default language, `http://localhost:3000/de/<slug>` for German.

---

## Content model

| Studio item | Type | Notes |
|---|---|---|
| Home, Work | singletons `home`, `work` | The site root and the `/work` landing |
| Pages | `page` | Routed at `/<slug>` |
| Work → Projects, Categories | `project`, `projectCategory` | Projects at `/work/<slug>`; categories filter project lists |
| Settings → Settings | `siteSettings` | Site title, SEO defaults, favicon |
| Settings → Navigation | `siteNav` | Main and footer menus, language switch, theme toggle |
| Settings → Error pages | `errorSettings` | 404 copy |
| Settings → Cookie Banner | `siteCookieBanner` | Banner and preferences copy, sections, privacy link |
| Settings → Analytics & Tracking | `siteAnalyticsSettings` | Consent switch, loading mode, trackers |
| Settings → Site languages | `siteLanguageSettings` | Available languages (order = fallback priority) and the default |

Links (menus, rich text) point at a home, page, work or project document, an external URL, or the `open-cookie-preferences` function.

---

## Modules

Pages render a `modules[]` array; rich text can embed modules inline. Four ship with the starter:

| Module | What it renders |
|---|---|
| `module.text` | Heading + rich text |
| `module.media` | Image, video or background loop, with caption |
| `module.carousel` | Slides of `module.media`, optional thumbnails |
| `module.contentRefs` | A list of pages or projects, with filter and sort for projects |

A module is a Studio schema plus a React component, wired in a fixed set of places. Never wire one by hand:

```bash
pnpm gen:module Quote            # schema, component, query; patches registries and the renderer
pnpm gen:module Quote --inline   # also insertable inside rich text
pnpm generate                    # regenerate TypeGen output
pnpm check:wiring                # verify every wiring point
```

The rules are in [`AGENTS.md`](AGENTS.md) → "The module pattern".

---

## Environment

Full comments live in [`web/.env.example`](web/.env.example) and [`studio/.env.example`](studio/.env.example). **BUILD** values are inlined at build time; a change needs a redeploy.

| Where | Variable | Required | Purpose |
|---|---|---|---|
| web + Studio | `SANITY_STUDIO_PROJECT_ID` | yes | Sanity project id (BUILD) |
| web + Studio | `SANITY_STUDIO_DATASET` | no | Pins the dataset; unset, it is resolved (below) (BUILD) |
| web + Studio | `SANITY_STUDIO_DEPLOYMENT_TARGET` | no | Dataset preference when unpinned; on the web also whether the deploy is production (`robots.txt`, canonical origin) (BUILD) |
| web + Studio | `SANITY_STUDIO_DATASET_DEVELOPMENT` / `_PRODUCTION` | no | Only if your datasets have other names |
| web | `SANITY_API_READ_TOKEN` | for Draft Mode | Viewer token: Draft Mode and Presentation (secret) |
| web | `SANITY_REVALIDATE_SECRET` | production | Signs the revalidate webhook (secret) |
| web | `NEXT_PUBLIC_SANITY_STUDIO_URL` | production | Studio URL for click-to-edit and CSP `frame-ancestors`; default `http://localhost:3333` (BUILD) |
| web | `NEXT_PUBLIC_SITE_URL` | no | Canonical origin; unset, the host's own URL on Netlify/Vercel (BUILD) |
| web | `CSP_ANALYTICS_ORIGINS` | no | Self-hosted analytics origins for the CSP (BUILD) |
| web | `SANITY_USE_CDN` | no | Force the Sanity API CDN on or off |
| Studio | `SANITY_STUDIO_PREVIEW_ORIGIN` | no | Web origin Presentation opens; default `http://localhost:3000` |
| Studio | `SANITY_STUDIO_WEB_PREVIEW_ORIGINS` | no | Extra origins Presentation may open (deploy previews) |
| Studio | `SANITY_STUDIO_HOSTING_URL` | Netlify Studio | The Studio's own URL; default Netlify's `URL` |
| Studio | `SANITY_STUDIO_APP_ID` | Sanity Hosting | App id `sanity deploy` prints on the first deploy |
| Netlify Studio site | `SANITY_AUTH_TOKEN` | no | Deploy token: registers the Studio and uploads the schema on production deploys (secret) |

**Every `SANITY_STUDIO_*` variable is public**: the Studio bundle inlines them. Never give a token that prefix.

### How `@repo/sanity-dataset-resolve` picks a dataset

Runs once per build or dev-server start, for the web in `web/next.config.ts`, for the Studio in `studio/sanity.cli.ts`. Both inline the result, so the browser never resolves it:

1. `SANITY_STUDIO_DATASET` wins.
2. Otherwise `SANITY_STUDIO_DEPLOYMENT_TARGET` sets the order: `production` → production first; `development` / `preview` → development first; any other value (e.g. `staging`) → that dataset first. Unset: production first on a Netlify/Vercel production build, development first everywhere else (a local `next build` or `sanity build` included).
3. The first candidate that exists wins (checked on the public API, no token). Offline it takes the first candidate, never a silent switch to production.

---

## Content freshness and the revalidate webhook

Routes are static and every Sanity read is cached with tags. A publish reaches visitors through a webhook:

| | Webhook configured | No webhook |
|---|---|---|
| On publish | `/api/revalidate` expires the matching tags; the next request renders fresh. | `SanityLive` revalidates while some visitor has a tab open. A publish while nobody is on the site stays invisible until the next publish event reaches an open tab, or the next deploy. |

**Production needs the webhook.** Set it up once per site:

1. Generate a secret, e.g. `openssl rand -base64 32`.
2. Set it as `SANITY_REVALIDATE_SECRET` on the web host and redeploy.
3. In [sanity.io/manage](https://www.sanity.io/manage) → your project → **API → Webhooks → Create webhook**:
   - **URL:** `https://<your-site>/api/revalidate`
   - **Dataset:** the dataset this site reads (usually `production`)
   - **Trigger on:** Create, Update, Delete
   - **Filter:**
     ```groq
     _type in ["home", "work", "page", "project", "projectCategory", "siteSettings", "siteNav", "siteCookieBanner", "siteAnalyticsSettings", "errorSettings", "siteLanguageSettings", "sanity.imageAsset", "mux.videoAsset"]
     ```
   - **Projection:** `{_type}`
   - **HTTP method:** POST; drafts and versions off
   - **Secret:** the value from step 1
4. Publish any document and open the webhook's **attempts log**: the response is `{"revalidated":true,"tags":[…]}`.

The filter mirrors `WEBHOOK_TAG_MAP` in [`web/sanity/cacheTags.ts`](web/sanity/cacheTags.ts), which also decides which tags each type purges. Asset types are in it so alt text and poster frames reach the site. When you add a document type, add it to both. Details: [`web/README.md`](web/README.md) → "Freshness".

---

## Analytics & cookie consent

Both live under **Settings** in the Studio:

- **Analytics & Tracking** — the trackers (GA4, Microsoft Clarity, PostHog, Plausible, Matomo), the loading mode and **Use cookie banner**. With the banner on and "Respect cookie banner", cookie-based trackers wait for consent and cookie-free ones load immediately. With the banner off, nothing asks for consent: only do that when no tracker needs it.
- **Cookie Banner** — the banner and preferences copy per language, consent sections and the privacy link. Empty fields fall back to defaults in the visitor's language.

Any menu or rich-text link can use the `open-cookie-preferences` function; it only renders while the banner is on. Origins of self-hosted trackers go into `CSP_ANALYTICS_ORIGINS`.

---

## Deploy

The site and the Studio are two Netlify sites from the same repository. Each skips its build when a push changed nothing it builds from.

### Web on Netlify

1. Import the repository as a new Netlify project. Base directory and package directory stay empty; the root [`netlify.toml`](netlify.toml) sets build command, publish directory and the Next.js plugin.
2. Environment: `SANITY_STUDIO_PROJECT_ID`, `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, `NEXT_PUBLIC_SANITY_STUDIO_URL`; optionally `NEXT_PUBLIC_SITE_URL` (or set it in `netlify.toml` → production context) and `CSP_ANALYTICS_ORIGINS`. Production deploys read `production`, deploy previews `development`; to change that, see [Dataset per site](#dataset-per-site).
3. Add your domain, then [the revalidate webhook](#content-freshness-and-the-revalidate-webhook).

### Studio on Netlify

[`studio/netlify.toml`](studio/netlify.toml) is the whole pipeline: `sanity build`, SPA routing, `noindex`, `frame-ancestors`. The dataset follows the deploy context like the web site's ([Dataset per site](#dataset-per-site)).

1. **Site** — import the same repository as a second project. Base directory empty, **package directory `studio`**, build command and publish directory empty.
2. **Environment** — `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_PREVIEW_ORIGIN` (the production web origin), `SANITY_STUDIO_HOSTING_URL` (the Studio's URL); optionally `SANITY_STUDIO_WEB_PREVIEW_ORIGINS`, `SANITY_AUTH_TOKEN` and `SANITY_STUDIO_DATASET` ([Dataset per site](#dataset-per-site)).
3. **Domain** — add the Studio domain (e.g. `studio.your-domain.tld`) under Domain management.
4. **CORS** — in sanity.io/manage → API → CORS origins, add that origin **with Allow credentials**, or login fails: `pnpm --filter studio exec sanity cors add https://studio.your-domain.tld --credentials`.
5. **Web site** — set `NEXT_PUBLIC_SANITY_STUDIO_URL` to the Studio URL and redeploy the web app, so Presentation can embed it and click-to-edit opens it.
6. **Register** — `pnpm studio:register` lists the URL as the project's Studio and uploads the schema (`--dry-run` to preview; uses your `sanity login`). With `SANITY_AUTH_TOKEN` (a deploy token) on the Studio site, every production deploy does it.

### Dataset per site

Each site picks its dataset at build, by the [rules above](#how-reposanity-dataset-resolve-picks-a-dataset): production deploys `production`, deploy previews and branch deploys `development`. To choose another, set `SANITY_STUDIO_DATASET` in that site's environment, for every deploy context, one context, or one branch. In the Netlify UI: **Site configuration → Environment variables → Add a variable → Different value for each deploy context**. Or with the [Netlify CLI](https://docs.netlify.com/cli/get-started/), per site:

```bash
# Studio: production edits `production`, previews and branch deploys `development`
netlify env:set SANITY_STUDIO_DATASET production --context production --site <studio-site>
netlify env:set SANITY_STUDIO_DATASET development --context deploy-preview branch-deploy --site <studio-site>

# Web: the `staging` branch deploy reads a `staging` dataset
netlify env:set SANITY_STUDIO_DATASET staging --context branch:staging --site <web-site>

# What a context gets
netlify env:get SANITY_STUDIO_DATASET --context production --site <studio-site>
```

- The name is inlined at build: redeploy the site after a change (**Deploys → Trigger deploy**).
- Don't set the dataset in a `netlify.toml`: values there override the UI and the CLI.
- `netlify deploy` builds on your machine and reads the variables of its `--context`, which defaults to `dev`. Pass the context you mean.
- Keep Studio and web in step per context: Presentation previews `SANITY_STUDIO_PREVIEW_ORIGIN` (and `SANITY_STUDIO_WEB_PREVIEW_ORIGINS`), and a web site on another dataset shows other content. Each web site needs [its own revalidate webhook](#content-freshness-and-the-revalidate-webhook) for the dataset it reads.

### Studio on Sanity Hosting (alternative)

`pnpm studio:deploy` publishes to `*.sanity.studio` (always allowed by the web CSP). The first deploy asks for a hostname and prints an app id: set it as `SANITY_STUDIO_APP_ID` so later deploys update the same Studio. Both targets can run side by side.

### Other hosts

Standard Next.js + Sanity: mirror the env vars. Headers come from `web/next.config.ts`; `robots.ts` and the canonical origin recognise Netlify and Vercel production builds, elsewhere set `SANITY_STUDIO_DEPLOYMENT_TARGET=production` and `NEXT_PUBLIC_SITE_URL`.

---

## Content migrations

Schema changes that move existing content ship as [`sanity migration`](https://www.sanity.io/docs/schema-and-content-migrations) scripts in [`studio/migrations/`](studio/migrations). After pulling an update, run each new one once per dataset, from `studio/`:

```bash
pnpm exec sanity migration run <name>                                                # dry run, dataset from sanity.cli.ts
pnpm exec sanity migration run <name> --project <id> --dataset <name> --no-dry-run  # apply
```

Every migration is idempotent; what it changes and when it is needed is listed in [`studio/scripts/README.md`](studio/scripts/README.md) → "Content migrations".

---

## Tooling

- **Scripts** — every root, `web` and `studio` script is described once, in [`AGENTS.md`](AGENTS.md) → "CLI command reference". Day to day: `pnpm dev`, `pnpm generate` after a schema or query change, `pnpm lint`, `pnpm typecheck`, `pnpm format`.
- **Biome** — [`biome.json`](biome.json) formats and lints everything (tabs; 2 spaces in `studio/`).
- **Hooks** — pre-commit formats staged files; pre-push runs `pnpm lint` and `pnpm typecheck`.
- **CI** — `.github/workflows/ci.yml` on Node 22: lint + typecheck + wiring + tooling tests, TypeGen diff guard, `next build` with the first-load JS budget (`.github/bundle-budget.json`), `sanity build`.
- **Dependabot** — monthly on both branches; minor + patch auto-merge after CI, majors wait for review.
- **AI agents** — [`AGENTS.md`](AGENTS.md) is canonical for Claude Code, Cursor, Copilot and others; the `CLAUDE.md` files and `.cursor/rules/` defer to it.

### Forking

The workflows besides `ci.yml` serve the starter's own organisation (Claude review, Dependabot review and auto-merge, Slack notifications). Delete them in a fork unless you set up the same secrets. Nested READMEs are part of the documentation; keep them.

---

## Going deeper

[`AGENTS.md`](AGENTS.md) → "Per-folder README index" lists every README and what it covers.

---

## Requirements

- **Node.js** 22.12 or newer (`engines`; `.nvmrc` pins 22).
- **pnpm** 10 (`packageManager` in the root `package.json`).
- A **Sanity project**.
- Optional: a **Mux** account for video, **Netlify** for hosting.

---

## License

[ISC](LICENSE). Use it, fork it, ship it.
