# Studio scripts

Small Node (ESM) helpers that run **outside** the Studio bundle: they use the Sanity CLI and your local `.env`, not the browser.

## Why these exist

- **Dataset sync** is **never** automatic. Copying production content into a development dataset is destructive for anything that only lived in `development`, so it must stay a **conscious, manual** step. The sync script only runs when you invoke it; the dev server only **reminds** you that the command exists.
- **`.env` loading**: these scripts run in plain Node without Vite. Their package scripts start Node with `--env-file-if-exists=.env`, so `studio/.env` supplies `SANITY_STUDIO_PROJECT_ID`, the dataset names and the tokens `sanity dev` sees. A variable already set in the shell or CI wins over the file. Run them through `pnpm run`, not `node` directly, or `.env` is not read.

---

## `dev-with-hint.mjs`

**What it does**

1. Prints a short, colored message to **stdout** with the exact commands to run a **production → development** dataset sync (`pnpm run sync:prod-to-dev` in `studio/`, or the monorepo equivalent).
2. Spawns **`pnpm exec sanity dev`** with `cwd` set to `studio/`, forwarding stdio so the dev server behaves like running `sanity dev` yourself.

**Why**

- Editors should discover the sync workflow when they start the Studio (`pnpm dev` in `studio/` or via the root workspace dev script), without running sync in the background or on a timer.
- If you want **no** hint (e.g. CI or a quiet terminal), run `pnpm exec sanity dev` directly from `studio/` instead of `pnpm dev`.

**Platform note**

- On Windows, `spawn` uses `shell: true` so `pnpm` resolves correctly.

---

## `sync-prod-to-dev.mjs`

**What it does (step by step)**

1. Reads **`SANITY_STUDIO_PROJECT_ID`** (required).
2. Resolves dataset names:
   - Production: `SANITY_STUDIO_DATASET_PRODUCTION` or **`production`**
   - Development: `SANITY_STUDIO_DATASET_DEVELOPMENT` or **`development`**
3. Aborts if both names are identical (avoids accidental self-overwrites).
4. Unless **`--yes`** / **`-y`** is passed, prompts for confirmation: importing will **replace** documents in the dev dataset that share IDs with the export.
5. Ensures **`studio/.sync-tmp/`** exists (gitignored).
6. **Export:** runs the Sanity CLI:
   - `sanity datasets export <prod> <path>/prod-to-dev-export.tar.gz --project-id <id> --overwrite`
   - Produces a **gzipped tarball** (documents + assets as implemented by the CLI; see Sanity docs for edge cases such as failed asset downloads).
7. **Import:** runs:
   - `sanity datasets import -d <dev> <same-tarball> --project-id <id> --replace`
   - **`--replace`** updates existing documents in the target dataset when IDs match the export.

**Why this design**

- **Export → file → import** is the supported Sanity CLI path for moving a full snapshot between datasets in the same project.
- **`--replace`** makes dev a **mirror** of the exported prod snapshot for matching IDs, which is what people usually want when “refreshing” dev from prod. It does **not** delete every document in dev first; behaviour for documents that exist only in dev depends on Sanity’s import semantics—treat as “prod wins for overlapping IDs.”
- **Confirmation** and **`--yes`** keep automation safe: you can script the latter when you are sure.

**Requirements**

- Authenticated CLI: typically **`sanity login`** on your machine, or a token the CLI can use (see Sanity’s docs for non-interactive use).
- **`SANITY_STUDIO_PROJECT_ID`** in `studio/.env`.

**Run** `pnpm studio:sync-prod-to-dev` (`pnpm run sync:prod-to-dev -- --yes` in `studio/` skips the prompt).

**Artifacts**

- Default export path: **`studio/.sync-tmp/prod-to-dev-export.tar.gz`** (ignored by git). You can delete or inspect it after a successful run.

---

## `mux-migrate-assets.mjs`

**What it does**

Lists every Mux asset (paged through the Mux API) and reports two things: assets with static MP4 renditions, and assets encoded at the `premium` quality level. A dry run by default; `--apply` sets `mp4_support: "none"` on the MP4 ones. Premium assets are only listed — Mux does not re-encode in place, so re-upload them in the Studio or replace them in the Mux dashboard. Resolution is not checked: `media.video` encodes up to 2160p on purpose (AGENTS.md → "Mux video resolution").

**When** — once per Mux environment, after the switch to HLS-only playback (`mp4_support: "none"`, `video_quality: "plus"` in `sanity.config.ts`), or when assets uploaded elsewhere show up with MP4 enabled.

**Run** `pnpm run mux:migrate-assets` in `studio/` (`-- --apply` writes). Needs `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` in `studio/.env`.

---

## `register-hosting.mjs`

**What it does**

Runs `sanity deploy --external --url <SANITY_STUDIO_HOSTING_URL> --yes`: registers the Netlify-hosted Studio's URL as the project's Studio (sanity.io/manage) and uploads the schema to the schema store. Clears `SANITY_STUDIO_APP_ID` for the call — that id names the `*.sanity.studio` deployment, and the CLI would otherwise register against it instead of the URL. Extra arguments go to the CLI.

**Why**

- `sanity deploy` registers and uploads the schema on its own for Sanity Hosting. A Studio built and served by Netlify never runs it, so without this step the project's Studio link and the stored schema fall behind.

**When it runs**

- **Netlify** — after `sanity build` (`studio/netlify.toml`). Production deploys with `SANITY_AUTH_TOKEN` set register; other contexts and token-less sites log the reason and exit 0. An unset `SANITY_STUDIO_HOSTING_URL` falls back to Netlify's `URL` (the site's primary domain).
- **Locally** — on demand, with your `sanity login` session.

**Run** `pnpm studio:register` (`--dry-run` previews).

---

## Content migrations (`../migrations/`)

Run by `sanity migration`, which reads an export of the dataset (drafts included) and writes patches. A run is a **dry run** unless you pass `--no-dry-run`: it prints every patch and writes nothing. Run each migration once per dataset, logged in with `sanity login`. Pass `--project` and `--dataset` together, or neither (then `sanity.cli.ts` decides).

### `type-cookie-banner-sections`

**What it does** (`variant/document-level` only), on every language's `siteCookieBanner`

- Turns the `sections` JSON into `cookieSection` objects (`cookieTable.body` rows become `cookies[]`). The untouched default JSON is unset; JSON that does not parse to an array is left alone and reported.
- Turns an absolute `privacyPolicyUrl` into an external `privacyPolicy` link. Its title is a custom `privacyPolicyLabel`, else the web's default label in the document's language (the `link` type requires a title). A relative path cannot become a page reference, so it is dropped and reported: pick the page in the Studio.
- Unsets texts still equal to the old English `initialValue`, so each language's document gets the web's default from `cookieBannerLabels.ts` in its own language.

Values already in the new shape are skipped, so a re-run is safe.

**When** — merge, deploy the web and the Studio, then migrate. Until then the web shows the default sections for the old JSON; nothing breaks.

**Run** in `studio/`:

```bash
pnpm exec sanity migration run type-cookie-banner-sections --project <id> --dataset development
pnpm exec sanity migration run type-cookie-banner-sections --project <id> --dataset development --no-dry-run
```

### `move-cookie-banner-switch`

**What it does** (`variant/document-level`; `main` has its own version for its singleton) — moves the cookie banner switch, `useCookieBanner`, from the per-language `siteCookieBanner` documents to `siteAnalyticsSettings`, next to the trackers it gates; the one switch then covers every language. The default language's published banner decides (`siteLanguageSettings.defaultLanguageId`; it stops if there is none): its value goes onto the analytics document and its draft, unless they have one already, and the analytics document is created when that banner was on and there is none. The field is then unset on every language's banner and its draft. A banner whose switch differs from the moved one (a draft, or another language) is reported. Banners without a `language` (`main`'s singleton in a shared dataset) are left alone. A re-run finds nothing to move.

**When** — merge, deploy the web and the Studio, then migrate. Until then the web reads the unset switch as on (it fails closed): the banner shows in every language and cookie-based trackers wait for consent, also where a language had its banner off. A site whose default-language banner is on but that has no analytics document shows no banner and no cookie-preference links until the migration creates the document; it has no trackers, so nothing loads without consent.

**Run** in `studio/`:

```bash
pnpm exec sanity migration run move-cookie-banner-switch --project <id> --dataset development
pnpm exec sanity migration run move-cookie-banner-switch --project <id> --dataset development --no-dry-run
```

### `rename-text-module-title`

**What it does** (both branches) — moves a text module's `title` to `heading`, the name `module.carousel` and `module.contentRefs` use. The value keeps its shape (i18n array on `main`, string on the variant). Modules that already have a `heading` are skipped, so a re-run is safe.

**When** — merge, deploy the web and the Studio, then migrate right away. Until then text modules render without their heading; nothing breaks.

**Run** in `studio/`:

```bash
pnpm exec sanity migration run rename-text-module-title --project <id> --dataset development
pnpm exec sanity migration run rename-text-module-title --project <id> --dataset development --no-dry-run
```

### `unify-carousel-slides`

**What it does** (both branches) — moves every carousel to one `slides` list of `module.media`, in modules and in rich text. The list the web rendered is kept: with `imagesOnly` on (or unset) each plain image in `slides` becomes an image media slide without a caption; with it off, `slidesMedia` moves to `slides`. `imagesOnly` and `slidesMedia` are unset, so the hidden list's content is dropped. Carousels already in the new shape are skipped, so a re-run is safe.

**When** — merge, deploy the web and the Studio, then migrate right away. Until then a carousel in the old shape renders nothing; nothing breaks.

**Run** in `studio/`:

```bash
pnpm exec sanity migration run unify-carousel-slides --project <id> --dataset development
pnpm exec sanity migration run unify-carousel-slides --project <id> --dataset development --no-dry-run
```

### `unset-unused-fields`

**What it does** (both branches) — unsets stored fields no schema declares, which the Studio lists as unknown fields: the hidden `title` of `siteNav`, `siteCookieBanner`, `siteAnalyticsSettings` and `siteLanguageSettings` (it only fed their previews, which now show a fixed title), `serverErrorTitle` / `serverErrorBody` on `errorSettings`, and `cookieFree` on Clarity and Plausible trackers (the web decides their consent by type). Missing fields are skipped, so a re-run is safe.

**When** — any time after the Studio deploy. Nothing reads these fields; until then they only show as unknown fields.

**Run** in `studio/`:

```bash
pnpm exec sanity migration run unset-unused-fields --project <id> --dataset development
pnpm exec sanity migration run unset-unused-fields --project <id> --dataset development --no-dry-run
```

---

## Related docs

- [`../README.md`](../README.md) — Studio overview and sync summary
- [`../../README.md`](../../README.md#datasets) — How the dataset is picked
- [`../.env.example`](../.env.example) — Env vars for project ID and dataset names
