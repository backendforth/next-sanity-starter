# next-sanity-starter

A starter for multilingual websites edited in Sanity: a **Next.js 16** site and a **Sanity Studio v6**, both deployable to Netlify, with optional **Mux** video.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![Sanity v6](https://img.shields.io/badge/Sanity-6-f03e2f?logo=sanity&logoColor=white)](https://www.sanity.io)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Biome](https://img.shields.io/badge/Biome-2-60a5fa?logo=biome&logoColor=white)](https://biomejs.dev)
[![License: ISC](https://img.shields.io/badge/license-ISC-green)](LICENSE)

This README takes you from a fresh clone to a site in production. Read it in order once: each section builds on the ones before. For a new project, the [setup checklist](#setup-checklist) lists every step to tick off. Details live next to the code, see [Further reading](#further-reading).

## Contents

1. [What you get](#what-you-get)
2. [Choose a branch](#choose-a-branch)
3. [Repository layout](#repository-layout)
4. [Requirements](#requirements)
5. [Local setup](#local-setup)
6. [How it works](#how-it-works)
7. [Environment variables](#environment-variables)
8. [Deploy](#deploy)
9. [Day-to-day work](#day-to-day-work)
10. [Setup checklist](#setup-checklist)
11. [Further reading](#further-reading)

---

## What you get

- **Site.** Next.js App Router with language routing: the default language has no URL prefix, every other one lives under `/<language>/…`. Routes render statically and refresh per document type.
- **Studio.** Sanity Studio v6 with Structure, Presentation (live preview with click-to-edit), one document per language and the site's languages in one settings document.
- **Content modules.** Every content block is a Studio schema plus a React component. `pnpm gen:module` creates and wires a new one, CI checks the wiring.
- **Media.** Responsive images from the Sanity CDN with crop, hotspot and no layout shift. Mux video as a full player or a muted background loop. Video code loads only on pages that have a video.
- **SEO.** A sitemap with language alternates, canonical and `hreflang` tags on every route, and a `robots.txt` that allows crawling only on production.
- **Security headers.** CSP, HSTS, `Permissions-Policy`, `Referrer-Policy` and `X-Content-Type-Options`, set in `web/next.config.ts` so they reach every page on any host.
- **Cookie consent and analytics.** An optional cookie banner and five trackers (GA4, Microsoft Clarity, PostHog, Plausible, Matomo), all set up in the Studio.
- **Typed queries.** Sanity TypeGen generates the result type of every GROQ query. CI fails when the types are out of date.
- **Styling.** Tailwind CSS v4 with design tokens in CSS and a light/dark toggle.

---

## Choose a branch

The starter has two branches. They share every document type, module, query and component and differ in one thing: where a translation lives.

| Branch | Translations | Pick it when |
|---|---|---|
| [`main`](../../tree/main) | **Per field.** One document per page, every translatable field holds all languages (`sanity-plugin-internationalized-array`). | All languages share one structure: same slug, same modules. |
| [`variant/document-level`](../../tree/variant/document-level) | **Per document.** One document per language, linked as translations (`@sanity/document-internationalization`). | Languages differ: own slugs, own modules, own SEO. |

[`AGENTS.md`](AGENTS.md) → "Branch-specific notes" lists every difference.

---

## Repository layout

A pnpm workspace with two apps and four shared packages.

| Path | What it is |
|---|---|
| `web/` | The Next.js site |
| `studio/` | The Sanity Studio: schema, structure, migrations, scripts |
| `packages/sanity-dataset-resolve/` | Picks the dataset for site and Studio, and decides whether a deploy is production |
| `packages/site-languages/` | Language rules shared by site and Studio |
| `packages/scaffold-module/` | `pnpm gen:module` |
| `packages/check-wiring/` | `pnpm check:wiring` and `pnpm check:typegen`, both run in CI |

---

## Requirements

- Node.js 22.12 or newer. `.nvmrc` pins 22.
- pnpm 10. The root `package.json` pins the exact version under `packageManager`.
- A Sanity project, created at [sanity.io/manage](https://www.sanity.io/manage).
- Optional: a [Mux](https://www.mux.com) account for video, a [Netlify](https://www.netlify.com) account for hosting.

---

## Local setup

1. Clone and install.
   ```bash
   git clone <your-fork>.git my-site
   cd my-site
   pnpm install
   ```
2. Copy the env files and set `SANITY_STUDIO_PROJECT_ID` in both. It is the only value local work needs.
   ```bash
   cp web/.env.example web/.env.local
   cp studio/.env.example studio/.env
   ```
3. Log in to Sanity. The CLI commands in this README use that login.
   ```bash
   pnpm --filter studio exec sanity login
   ```
4. Create a `development` dataset. Local runs use it, so you never edit production while you work. Without it they fall back to `production`.
   ```bash
   pnpm --filter studio exec sanity datasets create development
   ```
5. Allow the local origins in Sanity's CORS settings (sanity.io/manage → your project → API → CORS origins). New projects usually list the Studio already.
   ```bash
   pnpm --filter studio exec sanity cors add http://localhost:3333 --credentials
   pnpm --filter studio exec sanity cors add http://localhost:3000 --credentials
   ```
   The Studio needs its origin to log you in. The site needs its origin for live updates, and credentials because preview sends a token from the browser.
6. Start site and Studio.
   ```bash
   pnpm dev    # site on http://localhost:3000, Studio on http://localhost:3333
   ```
7. Add the first content in the Studio:
   1. **Settings → Site languages**: check the languages (`en` and `de`, default `en`) and publish.
   2. **Home**: add a module and publish.
   3. **Pages**: create a page with a slug and publish.

   The page is at `http://localhost:3000/<slug>`, in German at `http://localhost:3000/de/<slug>`.
8. Optional, for preview and click-to-edit: create a token with the **Viewer** role (sanity.io/manage → API → Tokens), set it as `SANITY_API_READ_TOKEN` in `web/.env.local`, restart `pnpm dev` and open **Presentation** in the Studio.

---

## How it works

### Content model

| Studio item | Document type | What it holds |
|---|---|---|
| Home, Work | `home`, `work` | The site root and the `/work` landing page |
| Pages | `page` | Pages at `/<slug>` |
| Work → Projects, Categories | `project`, `projectCategory` | Projects at `/work/<slug>`; categories filter project lists |
| Settings → Settings | `siteSettings` | Site title, SEO defaults, favicon |
| Settings → Navigation | `siteNav` | Main and footer menu, language switch, theme toggle |
| Settings → Error pages | `errorSettings` | Text of the 404 page |
| Settings → Cookie Banner | `siteCookieBanner` | Banner and preferences text, consent sections, privacy link |
| Settings → Analytics & Tracking | `siteAnalyticsSettings` | Trackers, loading mode, cookie banner switch |
| Settings → Site languages | `siteLanguageSettings` | Available languages, the order of the language switch and the default |

Links in menus and rich text point at a home, page, work or project document, an external URL, or the `open-cookie-preferences` function.

### Modules

Home, Work and every page render a list of modules. Rich text, such as a project's body, can embed the media and carousel modules. Four modules ship with the starter:

| Module | Renders |
|---|---|
| `module.text` | Heading and rich text |
| `module.media` | Image, video or background loop, with caption |
| `module.carousel` | Slides of `module.media`, optional thumbnails |
| `module.contentRefs` | A list of pages or projects; project lists can filter and sort |

A module is a Studio schema plus a React component, registered in eight places. `pnpm gen:module` does all of it:

```bash
pnpm gen:module Quote            # schema, component, query, registrations
pnpm gen:module Quote --inline   # the same, and insertable inside rich text
pnpm generate                    # regenerate the types
pnpm check:wiring                # verify all eight places
```

[`AGENTS.md`](AGENTS.md) → "The module pattern" has the rules.

### Languages

The languages come from **Settings → Site languages**: an id (`en`, `de`, `de-CH`), a name and the default. The default language has no URL prefix. The order is the order of the language switch. Every translatable document exists once per language, linked to its translations: the translation menu in the document's header creates the version in another language. Visitors switch languages with the language switch entry in **Settings → Navigation**; it opens the same document in the other language, or that language's home when there is none. Fixed interface text (buttons, labels, cookie banner defaults) lives in `web/src/i18n/`.

To add a language:

1. Studio → **Settings → Site languages**: add the id and name, publish, reload the Studio. Documents can now be created in that language.
2. Add the language's interface text to `web/src/i18n/uiLabels.ts` and `web/src/i18n/cookieBannerLabels.ts`. Without it the language shows English interface text; a regional id like `de-CH` uses its base language's.
3. Create the translations from each document's translation menu: Home, Work, the settings documents (Settings, Navigation, Error pages, Cookie Banner), then pages and projects. A document without a translation does not exist under that language's URLs.

No schema, query or component changes. [`web/src/i18n/README.md`](web/src/i18n/README.md) explains the internals.

### Datasets

A dataset is a separate content store inside the Sanity project. The starter uses `production` for the live site and `development` for local work and previews. Site and Studio pick their dataset once, when they build or when the dev server starts (`web/next.config.ts`, `studio/sanity.cli.ts`), and write the name into their code:

1. `SANITY_STUDIO_DATASET`, if set, wins.
2. Otherwise the candidates are tried in order. `SANITY_STUDIO_DEPLOYMENT_TARGET` sets the order: `production` tries production first, `development` or `preview` tries development first, any other value (e.g. `staging`) tries that dataset first. Without it, a Netlify or Vercel production build tries production first and everything else development first, a local `next build` or `sanity build` included.
3. The first candidate that exists wins, checked on the public API without a token. Offline, the first candidate wins. It never switches to production silently.

On Netlify you set the dataset per site and deploy context, see [Dataset per site](#dataset-per-site).

### Freshness

Routes render statically, and every Sanity read is cached under a tag per document type. A publish reaches visitors in one of two ways:

| | With the revalidate webhook | Without it |
|---|---|---|
| On publish | Sanity calls `/api/revalidate`, which expires the matching tags. The next request renders fresh. | `SanityLive` refreshes the tags while a visitor has the site open. A publish while nobody is on the site stays invisible until the next publish reaches an open tab, or the next deploy. |

Production needs the webhook. [Revalidate webhook](#revalidate-webhook) sets it up.

### Preview and click-to-edit

**Presentation** in the Studio opens the site in a frame, switches it to Draft Mode (`/api/draft-mode/enable`) and shows drafts with click-to-edit overlays. It needs three settings:

- `SANITY_API_READ_TOKEN` on the site: a Viewer token, so the site can read drafts.
- `SANITY_STUDIO_PREVIEW_ORIGIN` on the Studio: the site's origin. Default `http://localhost:3000`. `SANITY_STUDIO_WEB_PREVIEW_ORIGINS` adds more, such as deploy previews.
- `NEXT_PUBLIC_SANITY_STUDIO_URL` on the site: the Studio's URL, so the site lets the Studio frame it and click-to-edit opens the right Studio. Default `http://localhost:3333`; `*.sanity.studio` is always allowed.

Site and Studio must read the same dataset, or the preview shows other content.

### Video

1. In the Mux dashboard, create an access token with read and write for Mux Video and read for Mux Data.
2. In the Studio, add a video to a media module. The first time, the Mux plugin asks for the token and its secret and stores them in the dataset (document `secrets.mux`).

The site needs no Mux setting. Mux encodes full videos up to 2160p and background loops up to 1440p ([`AGENTS.md`](AGENTS.md) → "Mux video resolution").

### Analytics and cookie consent

Both live under **Settings** in the Studio.

- **Analytics & Tracking** holds the trackers, the loading mode and **Use cookie banner**. With the banner on and "Respect cookie banner", trackers that set cookies wait for consent, cookie-free ones load right away. With the banner off nothing asks for consent, so turn it off only when no tracker needs consent.
- **Cookie Banner** exists once per language and holds the banner and preferences text, the consent sections and the privacy link. A language without its own banner shows the default language's. Empty fields show defaults in the banner's language.

A menu or rich-text link with the `open-cookie-preferences` function opens the preferences; it only shows while the banner is on. Self-hosted trackers need their origin in `CSP_ANALYTICS_ORIGINS`.

---

## Environment variables

Local values go into `web/.env.local` and `studio/.env`, deployed ones into each Netlify site's environment. The example files comment every variable: [`web/.env.example`](web/.env.example), [`studio/.env.example`](studio/.env.example).

**Build** marks a value that is written into the code when the app builds: a change needs a new deploy. Every `SANITY_STUDIO_*` value ends up in the public Studio bundle, so never give a token or secret that prefix.

| App | Variable | Needed | Purpose |
|---|---|---|---|
| both | `SANITY_STUDIO_PROJECT_ID` | always | Sanity project id. Build |
| both | `SANITY_STUDIO_DATASET` | no | Fixes the dataset, see [Datasets](#datasets). Build |
| both | `SANITY_STUDIO_DEPLOYMENT_TARGET` | no | Dataset order when no dataset is set. On the site it also decides whether the deploy counts as production for `robots.txt` and canonical URLs. Build |
| both | `SANITY_STUDIO_DATASET_DEVELOPMENT`, `SANITY_STUDIO_DATASET_PRODUCTION` | no | Only if your datasets have other names |
| site | `SANITY_API_READ_TOKEN` | for preview | Viewer token for Draft Mode and Presentation. Secret |
| site | `SANITY_REVALIDATE_SECRET` | production | Verifies the [revalidate webhook](#revalidate-webhook). Production context only, empty locally. Secret |
| site | `NEXT_PUBLIC_SANITY_STUDIO_URL` | production | The Studio's URL, default `http://localhost:3333`. Build |
| site | `NEXT_PUBLIC_SITE_URL` | no | Canonical origin. Unset, the host's own URL on Netlify and Vercel. Build |
| site | `CSP_ANALYTICS_ORIGINS` | no | Origins of self-hosted trackers, comma-separated. Build |
| site | `SANITY_USE_CDN` | no | `true` or `false` forces the Sanity API CDN on or off. Default: on in production |
| Studio | `SANITY_STUDIO_PREVIEW_ORIGIN` | production | The site's origin for Presentation, default `http://localhost:3000` |
| Studio | `SANITY_STUDIO_WEB_PREVIEW_ORIGINS` | no | More origins Presentation may open, comma-separated |
| Studio | `SANITY_STUDIO_HOSTING_URL` | Netlify | The Studio's own URL. Default: the Netlify site's URL |
| Studio | `SANITY_STUDIO_APP_ID` | Sanity Hosting | The app id the first `pnpm studio:deploy` prints |
| Studio | `SANITY_AUTH_TOKEN` | no | Token with the Deploy Studio role on the Netlify Studio site: production deploys register the Studio. Secret |
| Studio | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` | no | Only for the one-off `pnpm mux:migrate-assets` script. Secret |

---

## Deploy

Site and Studio are two Netlify sites built from the same repository. Each one builds only when a push changes files it is built from. For the first deploy, go through the steps below in order.

### Web on Netlify

1. In Netlify, import the repository as a new project. Leave base directory and package directory empty: the root [`netlify.toml`](netlify.toml) sets build command, publish directory and the Next.js plugin.
2. Under **Project configuration → Environment variables**, set `SANITY_STUDIO_PROJECT_ID` and `SANITY_API_READ_TOKEN`. Optional: `NEXT_PUBLIC_SITE_URL`, `CSP_ANALYTICS_ORIGINS`. `SANITY_REVALIDATE_SECRET` comes with the webhook in step 5.
3. Deploy, then add your domain under **Domain management**.
4. Add the site's origin to Sanity's CORS origins, with credentials (see [Local setup](#local-setup), step 5).
5. Set up the [revalidate webhook](#revalidate-webhook).

Production deploys read the `production` dataset, deploy previews and branch deploys `development`. [Dataset per site](#dataset-per-site) changes that.

### Revalidate webhook

The webhook tells the site that content changed. On every publish, Sanity sends the document's type to `/api/revalidate`, the site expires the matching caches, and the next visitor gets the new content. Every production site needs one.

Two parts belong together, and the order below matters:

- **`SANITY_REVALIDATE_SECRET`** on the site. With it set, the site switches its live updates (`SanityLive`) off and relies on the webhook.
- **The webhook in Sanity**, signed with the same secret.

A secret without a webhook means no content change reaches the site until the next deploy. A webhook without the secret only produces errors.

You need:

- the site's address, e.g. `https://your-domain.tld` or `https://<site-name>.netlify.app`
- access to the web site on Netlify and to the project on [sanity.io/manage](https://www.sanity.io/manage)
- a terminal

#### 1. Generate the secret

The secret is a random string of 64 characters. Pick one of these commands:

```bash
# macOS: straight into the clipboard, nothing shows on screen
openssl rand -hex 32 | tr -d '\n' | pbcopy
```
```bash
# macOS and Linux: prints the secret
openssl rand -hex 32
```
```bash
# Any system with Node.js: prints the secret
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Every run makes a new secret. Generate it once, paste it into Netlify (step 2) and Sanity (step 3) before you copy anything else, and keep it in a password manager if you want to look it up later. It never goes into a commit, a `.env` file, a chat or a ticket.

#### 2. Add the secret to the web site on Netlify

1. Open the web site on Netlify → **Project configuration → Environment variables → Add a variable → Add a single variable**.
2. Fill in:

   | Field | Value |
   |---|---|
   | Key | `SANITY_REVALIDATE_SECRET` |
   | Secret | tick **Contains secret values** if Netlify offers it |
   | Scopes | All scopes |
   | Values | **Different value for each deploy context**: paste the secret under **Production** only, leave every other context empty |

3. Save.

Why production only: the webhook calls only the production address. Deploy previews and branch deploys never hear from it, so they stay without the secret and keep their live updates. For the same reason the variable stays empty in `web/.env.local`.

#### 3. Create the webhook in Sanity

1. Open [sanity.io/manage](https://www.sanity.io/manage) → your project → **API → Webhooks**. If a webhook for this site exists already, edit it instead of creating a second one.
2. **Create webhook** and fill in:

   | Field | Value |
   |---|---|
   | Name | e.g. `Revalidate production site` |
   | Description | optional |
   | URL | `https://<your-site>/api/revalidate` |
   | Dataset | the dataset this site reads, usually `production` |
   | Trigger on | Create, Update, Delete |
   | Filter | the condition below, exactly as shown, without `*[ ]` around it |
   | Projection | `{_type}`, with the curly braces |
   | Status | enabled |
   | HTTP method | `POST` |
   | HTTP headers | none |
   | API version | leave the default |
   | Drafts | off: only publishing triggers it |
   | Versions | off |
   | Secret | the secret from step 1 |

   Filter:
   ```groq
   _type in ["home", "work", "page", "project", "projectCategory", "siteSettings", "siteNav", "siteCookieBanner", "siteAnalyticsSettings", "errorSettings", "siteLanguageSettings", "translation.metadata", "sanity.imageAsset", "mux.videoAsset"]
   ```
3. Save.

#### 4. Redeploy the site

Netlify → the web site → **Deploys → Trigger deploy → Deploy site**. The site reads the secret when it is deployed, so a deploy that started before step 2 doesn't count.

When the deploy is live, check that the secret arrived. An unsigned request must be rejected:

```bash
curl -X POST -H 'content-type: application/json' -d '{}' https://<your-site>/api/revalidate
```

`{"message":"Invalid signature"}` means the secret is active. `SANITY_REVALIDATE_SECRET is not configured` means it isn't: go back to step 2.

#### 5. Test with a real publish

Change any document in the Studio and publish it. Then open the webhook in sanity.io/manage and look at its **attempts log**:

| Response | Meaning | Fix |
|---|---|---|
| `200 {"revalidated":true,"tags":[…]}` | Works | |
| `200 {"revalidated":false,…}` | The type is in the filter but not in `WEBHOOK_TAG_MAP` | Add it to `web/sanity/cacheTags.ts` |
| `500 SANITY_REVALIDATE_SECRET is not configured` | The secret doesn't reach the site | Step 2: Production context filled? Then step 4 |
| `401 Invalid signature` | The secrets on Netlify and in Sanity differ | Paste the same secret into both, then step 4 |
| `404` | Wrong URL | Check the address and the `/api/revalidate` path |
| no entry at all | The webhook didn't fire | Check dataset, status and that the document's type is in the filter |

#### Later

- **Change the secret:** generate a new one, put it into Netlify and the webhook, redeploy. Publishes in between fail with `401`; publish once more afterwards.
- **Another site** on its own dataset (e.g. staging) gets its own webhook with its own secret. Deploy previews need none.
- **A new document type** goes into the filter and into `WEBHOOK_TAG_MAP` in [`web/sanity/cacheTags.ts`](web/sanity/cacheTags.ts).

The filter lists every document type the site shows, `translation.metadata` for the links between translations, and image and Mux assets so new alt text and poster frames reach the site. The projection sends only the type; `WEBHOOK_TAG_MAP` maps it to the cache tags to expire. Details: [`web/README.md`](web/README.md) → "Freshness".

### Studio on Netlify

[`studio/netlify.toml`](studio/netlify.toml) holds the whole build: `sanity build`, routing for the single-page app, `noindex` and the frame protection.

1. Import the same repository as a second Netlify project. Base directory empty, **package directory `studio`**, build command and publish directory empty.
2. Set `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_PREVIEW_ORIGIN` (the site's production origin) and `SANITY_STUDIO_HOSTING_URL` (the Studio's URL). Optional: `SANITY_STUDIO_WEB_PREVIEW_ORIGINS`, `SANITY_AUTH_TOKEN`.
3. Add the Studio's domain, e.g. `studio.your-domain.tld`, under **Domain management**.
4. Add that origin to Sanity's CORS origins **with credentials**, or login fails:
   ```bash
   pnpm --filter studio exec sanity cors add https://studio.your-domain.tld --credentials
   ```
5. On the web site, set `NEXT_PUBLIC_SANITY_STUDIO_URL` to the Studio's URL and redeploy it, so Presentation can frame the site and click-to-edit opens this Studio.
6. Register the Studio with Sanity: `pnpm studio:register` lists its URL in the project and uploads the schema (`--dry-run` to preview). With `SANITY_AUTH_TOKEN` on the Studio site, every production deploy does this on its own.

### Dataset per site

Without any setting, both sites follow the deploy context:

| Netlify deploy context | Dataset |
|---|---|
| Production | `production` |
| Deploy previews (pull requests) | `development` |
| Branch deploys | `development` |

To use another dataset, set `SANITY_STUDIO_DATASET` in that site's environment. You can give each deploy context, and each branch, its own value. Site and Studio are set separately.

**In the Netlify UI:**

1. Open the site → **Project configuration → Environment variables → Add a variable**.
2. Key `SANITY_STUDIO_DATASET`. Choose **Different value for each deploy context** and enter a dataset per context. A single branch gets its own value with **Add branch value**.
3. Save, then **Deploys → Trigger deploy**. The name is written into the code at build, so only a new deploy picks it up. A branch value takes effect with the next deploy of that branch.

**With the Netlify CLI** (`pnpm add -g netlify-cli`, then `netlify login`):

```bash
# Studio: production edits `production`, previews and branch deploys edit `development`
netlify env:set SANITY_STUDIO_DATASET production --context production --site <studio-site>
netlify env:set SANITY_STUDIO_DATASET development --context deploy-preview branch-deploy --site <studio-site>

# Site: the `staging` branch reads a `staging` dataset
netlify env:set SANITY_STUDIO_DATASET staging --context branch:staging --site <web-site>

# Show what a context gets
netlify env:get SANITY_STUDIO_DATASET --context production --site <studio-site>
```

`<studio-site>` and `<web-site>` are the Netlify project names or ids. Then trigger a deploy as above.

Keep in mind:

- Don't put the dataset into a `netlify.toml`. Values there override the UI and the CLI.
- A deploy from your machine (`netlify deploy`) builds with the values of its `--context`, which defaults to `dev`. Pass the context you mean.
- Give Studio and site the same dataset per context. Presentation shows the site at `SANITY_STUDIO_PREVIEW_ORIGIN`; if that site reads another dataset, the preview shows other content.
- A site on its own dataset needs its own [revalidate webhook](#revalidate-webhook) for that dataset.

### Studio on Sanity Hosting (alternative)

`pnpm studio:deploy` publishes the Studio to `<name>.sanity.studio`. It edits `production`, unless `SANITY_STUDIO_DATASET` in `studio/.env` names another dataset. The first deploy asks for a hostname and prints an app id: set it as `SANITY_STUDIO_APP_ID` in `studio/.env`, so later deploys update the same Studio. The site's CSP always allows `*.sanity.studio`. Netlify and Sanity Hosting can run side by side.

### Other hosts

The site is a standard Next.js app: set the same variables. Outside Netlify and Vercel, set `SANITY_STUDIO_DEPLOYMENT_TARGET=production` and `NEXT_PUBLIC_SITE_URL` on the production deploy, since only those two hosts are recognized as production on their own.

---

## Day-to-day work

### Commands

Run from the repository root.

| Command | Does |
|---|---|
| `pnpm dev` | Starts site (3000) and Studio (3333). `pnpm web:dev` or `pnpm studio:dev` starts one |
| `pnpm generate` | Regenerates schema and query types. Run it after every schema or query change |
| `pnpm check:wiring` | Checks that every module is registered everywhere |
| `pnpm typecheck` | TypeScript in all packages |
| `pnpm lint` / `pnpm format` | Biome check / Biome fix |
| `pnpm build` | Builds site and Studio |
| `pnpm gen:module <Name>` | Creates a module, see [Modules](#modules) |
| `pnpm studio:sync-prod-to-dev` | Copies `production` into `development` |
| `pnpm studio:register` | Registers the Netlify Studio with Sanity |
| `pnpm studio:deploy` | Deploys the Studio to Sanity Hosting |

[`AGENTS.md`](AGENTS.md) → "CLI command reference" lists every script of root, site and Studio.

### After a schema or query change

1. `pnpm generate`, then commit the regenerated files. Never edit generated files (`*.gen.ts`, `studio/schema.json`) by hand.
2. `pnpm check:wiring` and `pnpm typecheck`.
3. If existing content has to move to the new shape, write a [content migration](#content-migrations).

### Extending the starter

- **A new content block** is a module: `pnpm gen:module <Name>`.
- **A new document type**: [`AGENTS.md`](AGENTS.md) → "Cookbook" → "Add a document type".
- **A new language**: [Languages](#languages).
- **A new query**: [`web/sanity/queries/README.md`](web/sanity/queries/README.md).

### Content migrations

Schema changes that move existing content ship as [`sanity migration`](https://www.sanity.io/docs/schema-and-content-migrations) scripts in [`studio/migrations/`](studio/migrations). After pulling an update, run each new one once per dataset, from `studio/`:

```bash
pnpm exec sanity migration run <name>                                                # dry run
pnpm exec sanity migration run <name> --project <id> --dataset <name> --no-dry-run  # apply
```

Every migration can run twice without harm. [`studio/scripts/README.md`](studio/scripts/README.md) → "Content migrations" says what each one changes and when it is needed.

### Refresh development from production

`pnpm studio:sync-prod-to-dev` exports `production` and imports it into `development`. Documents with the same id are replaced; documents only in `development` stay. It asks before it writes. Details: [`studio/scripts/README.md`](studio/scripts/README.md).

### Code quality and CI

- **Biome** formats and lints everything ([`biome.json`](biome.json)): tabs, two spaces in `studio/`.
- **Git hooks.** Pre-commit formats the staged files. Pre-push runs `pnpm lint` and `pnpm typecheck`.
- **CI** (`.github/workflows/ci.yml`, Node 22) runs lint, typecheck, `check:wiring`, the tooling tests, a check for stale types, `next build` with a size limit for the JavaScript of the first page load ([`.github/bundle-budget.json`](.github/bundle-budget.json)) and `sanity build`.
- **Dependabot** checks dependencies monthly on both branches. Minor and patch updates merge after CI, major ones wait for a review.
- **AI agents.** [`AGENTS.md`](AGENTS.md) is the rulebook for Claude Code, Cursor, Copilot and others. The `CLAUDE.md` files and `.cursor/rules/` point to it.

---

## Setup checklist

Every step for a new project, in order. Each one links to the section with the details. To tick them off, paste the list into the new repository's first issue, where GitHub makes the boxes clickable.

`sanity` commands run from the repository root and use your `sanity login`. `<…>` marks a value you fill in.

### 1. Repository

- [ ] Create the repository from this one, as a template or a fork, and keep the [branch](#choose-a-branch) you need.
- [ ] Delete the workflows in `.github/workflows/` other than `ci.yml`. Claude review, Dependabot review and auto-merge and the Slack notifications need the starter organisation's secrets.
- [ ] Install: `pnpm install`.

### 2. Sanity project

- [ ] Log in with the account that should own the project: `pnpm --filter studio exec sanity login`.
- [ ] Create the project with a public `production` dataset, and note the project id it prints. `sanity organizations list` shows the organization ids.
  ```bash
  pnpm --filter studio exec sanity projects create "<project name>" --organization <org-id> --dataset production --dataset-visibility public
  ```
- [ ] Copy the env files and set `SANITY_STUDIO_PROJECT_ID` in both. The commands below read it from `studio/.env`.
  ```bash
  cp web/.env.example web/.env.local
  cp studio/.env.example studio/.env
  ```
- [ ] Create the `development` dataset. Local work, deploy previews and staging use it.
  ```bash
  pnpm --filter studio exec sanity datasets create development --visibility public
  ```
  Both datasets are public because the site reads published content without a token. Drafts stay private.
- [ ] Invite the team as Administrators, one command per person:
  ```bash
  pnpm --filter studio exec sanity users invite <email> --role administrator
  ```
- [ ] Allow the local origins, with credentials:
  ```bash
  pnpm --filter studio exec sanity cors add http://localhost:3333 --credentials
  pnpm --filter studio exec sanity cors add http://localhost:3000 --credentials
  ```
- [ ] Create a Viewer token and set it as `SANITY_API_READ_TOKEN` in `web/.env.local`. Preview and click-to-edit need it, and the web project on Netlify gets the same value.
  ```bash
  pnpm --filter studio exec sanity tokens create "Preview" --role viewer
  ```

### 3. First run

- [ ] Start site and Studio: `pnpm dev`.
- [ ] In the Studio, set the languages and publish Home and a first page ([Local setup](#local-setup), step 7).
- [ ] Fill in **Settings** (site title, SEO, favicon) and **Navigation**.
- [ ] If the site tracks visitors: **Analytics & Tracking** and **Cookie Banner** ([Analytics and cookie consent](#analytics-and-cookie-consent)).
- [ ] If the site has video: the Mux token at the first upload ([Video](#video)).

### 4. Production on Netlify

Web project ([Web on Netlify](#web-on-netlify)):

- [ ] Import the repository as a new Netlify project, all directories empty.
- [ ] Set `SANITY_STUDIO_PROJECT_ID` and `SANITY_API_READ_TOKEN`.
- [ ] Add the domain under **Domain management**, and its origin to Sanity CORS:
  ```bash
  pnpm --filter studio exec sanity cors add https://<domain> --credentials
  ```

Studio project ([Studio on Netlify](#studio-on-netlify)):

- [ ] Import the repository a second time, package directory `studio`.
- [ ] Set `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_PREVIEW_ORIGIN` (`https://<domain>`) and `SANITY_STUDIO_HOSTING_URL` (`https://studio.<domain>`).
- [ ] Add `studio.<domain>` under **Domain management**, and its origin to Sanity CORS with `--credentials`.
- [ ] Let production deploys register the Studio: create a token and set it as `SANITY_AUTH_TOKEN` on the Studio project, then redeploy.
  ```bash
  pnpm --filter studio exec sanity tokens create "Netlify Studio" --role deploy-studio
  ```

Connect the two:

- [ ] On the web project, set `NEXT_PUBLIC_SANITY_STUDIO_URL` to `https://studio.<domain>` and redeploy.
- [ ] Set up the [revalidate webhook](#revalidate-webhook): secret on the web project's Production context, webhook in Sanity, redeploy, test.

### 5. Staging

Staging is a `staging` branch that both Netlify projects deploy as a branch deploy. Like deploy previews, it reads and edits `development`, so it needs no dataset setting. `robots.txt` keeps search engines out, and without the webhook secret `SanityLive` refreshes open pages ([Freshness](#freshness)).

- [ ] On both Netlify projects, allow branch deploys for `staging`: **Project configuration → Developer settings → Continuous deployment → Branches and deploy contexts → Configure → Branch deploys → Let me add individual branches**, enter `staging`.
- [ ] Point the staging site and the staging Studio at each other. Their URLs will be `https://staging--<web-project>.netlify.app` and `https://staging--<studio-project>.netlify.app`. In the UI this is a branch value per variable ([Dataset per site](#dataset-per-site)), or with the Netlify CLI:
  ```bash
  netlify env:set NEXT_PUBLIC_SANITY_STUDIO_URL https://staging--<studio-project>.netlify.app --context branch:staging --site <web-project>
  netlify env:set SANITY_STUDIO_PREVIEW_ORIGIN https://staging--<web-project>.netlify.app --context branch:staging --site <studio-project>
  ```
- [ ] Add both staging origins to Sanity CORS with `--credentials`.
- [ ] Copy the production content into `development`:
  ```bash
  pnpm studio:sync-prod-to-dev
  ```
  It asks before it writes. Documents with the same id are replaced, documents that only exist in `development` stay. Local work and deploy previews share the dataset and see the copy too.
- [ ] Create the branch from the default branch and push it. Both projects build their first staging deploy.
  ```bash
  git switch -c staging
  git push -u origin staging
  ```
- [ ] On the web project, add a build hook for the `staging` branch: **Project configuration → Developer settings → Continuous deployment → Build hooks → Add build hook**. After every later sync, call it, so staging renders from the new content. A push that changes none of the site's files skips the build, a build hook always runs.
  ```bash
  curl -X POST -d '{}' https://api.netlify.com/build_hooks/<hook-id>
  ```
  Keep the hook URL out of the repository: anyone who has it can start builds.

### 6. Before launch

- [ ] Publish a change in production. The webhook's attempt log shows `200 {"revalidated":true,…}`, and the site shows the change without a deploy.
- [ ] `https://<domain>/robots.txt` allows crawling, `https://staging--<web-project>.netlify.app/robots.txt` disallows it.
- [ ] **Presentation** in the production Studio opens the site, and click-to-edit jumps to the right field.

---

## Further reading

| Document | Covers |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Rules, the module pattern, every script, how-tos, the branch differences |
| [`studio/README.md`](studio/README.md) | The Studio's features and structure |
| [`web/README.md`](web/README.md) | The site: languages, freshness |
| [`web/sanity/README.md`](web/sanity/README.md) | Data layer, GROQ, Presentation troubleshooting |
| [`web/src/i18n/README.md`](web/src/i18n/README.md) | Language routing and fallback |
| [`studio/scripts/README.md`](studio/scripts/README.md) | Studio scripts and content migrations |

[`AGENTS.md`](AGENTS.md) → "Per-folder README index" lists every README.

---

## License

[ISC](LICENSE).
