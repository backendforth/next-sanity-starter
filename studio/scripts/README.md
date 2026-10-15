# Studio scripts

Small Node (ESM) helpers that run **outside** the Studio bundle: they use the Sanity CLI and your local `.env`, not the browser.

## Why these exist

- **Dataset sync** is **never** automatic. Copying production content into a development dataset is destructive for anything that only lived in `development`, so it must stay a **conscious, manual** step. The sync script only runs when you invoke it; the dev server only **reminds** you that the command exists.
- **`.env` loading** is duplicated here on purpose: these scripts run in plain Node without Vite. A tiny parser loads `studio/.env` so `SANITY_STUDIO_PROJECT_ID` and dataset name overrides match what you use for `sanity dev`, without adding a `dotenv` dependency.

---

## `loadEnvFile.mjs`

**What it does**

- `loadEnvFile(path)` reads a `.env` file line by line, skips empty lines and `#` comments, parses `KEY=value` (optional quotes), and sets `process.env[key]` **only if** the variable is not already set (so your shell or CI can override).
- `studioRootFromScript(import.meta.url)` resolves the `studio/` directory from any script file in `scripts/`.

**Why**

- Keeps `sync-prod-to-dev.mjs` and future CLI scripts aligned with the same env vars documented in `studio/.env.example`, without pulling in extra packages.

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

1. Loads `studio/.env` via `loadEnvFile`.
2. Reads **`SANITY_STUDIO_PROJECT_ID`** (required).
3. Resolves dataset names:
   - Production: `SANITY_STUDIO_DATASET_PRODUCTION` or **`production`**
   - Development: `SANITY_STUDIO_DATASET_DEVELOPMENT` or **`development`**
4. Aborts if both names are identical (avoids accidental self-overwrites).
5. Unless **`--yes`** / **`-y`** is passed, prompts for confirmation: importing will **replace** documents in the dev dataset that share IDs with the export.
6. Ensures **`studio/.sync-tmp/`** exists (gitignored).
7. **Export:** runs the Sanity CLI:
   - `sanity datasets export <prod> <path>/prod-to-dev-export.tar.gz --project-id <id> --overwrite`
   - Produces a **gzipped tarball** (documents + assets as implemented by the CLI; see Sanity docs for edge cases such as failed asset downloads).
8. **Import:** runs:
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

## `migrate-seo-i18n.mjs`

**What it does**

Wraps plain-string `seo.title` / `seo.description` (on `seo.page` and `seo.fallback`) into one `internationalizedArrayString` / `internationalizedArrayText` entry for the site's default language (`siteLanguageSettings.defaultLanguageId`; override with `--language <id>`). Empty strings are unset; values that are already arrays are skipped, so re-running is safe. Uses the `raw` perspective, so drafts are migrated too, and writes everything in one transaction. Each patch is tied to the revision that was read: if an editor changes a document while the prompt is open, nothing is written and the script asks you to run it again. `--language` must name an id from `siteLanguageSettings.availableLanguages`.

**Why**

- The SEO fields were plain strings, so meta title and description could not be translated. Datasets created before the switch hold strings the Studio now flags as invalid; the web resolver still reads them until you migrate.

**Run** `pnpm run migrate:seo-i18n` in `studio/`: `-- --dry-run` previews, the plain run asks before writing (`--yes` skips the prompt).

Targets `SANITY_STUDIO_DATASET` from `studio/.env` (else `development`) — run it once per dataset.

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

### `localize-captions-and-cookie-banner`

**What it does** (`main` only)

- Wraps string `caption`s of `media.image` / `media.video` / `media.videoLoop`, also inside modules and rich text, into one entry for the default language (`siteLanguageSettings.defaultLanguageId`; it stops if there is none).
- Does the same for the cookie banner's texts. A text still equal to the old English `initialValue` is unset instead, so every language gets the web's default from `cookieBannerLabels.ts`.
- Turns the `sections` JSON into `cookieSection` objects (`cookieTable.body` rows become `cookies[]`). The untouched default JSON is unset; JSON that does not parse to an array is left alone and reported.
- Turns an absolute `privacyPolicyUrl` into an external `privacyPolicy` link. Its title is a custom `privacyPolicyLabel`, else the web's default label in every language (the `link` type requires a title). A relative path cannot become a page reference, so it is dropped and reported: pick the page in the Studio.

Values already in the new shape are skipped, so a re-run is safe.

**When** — merge, deploy the web and the Studio, then migrate. Until then the web shows no caption and the default banner texts for the old values; nothing breaks.

**Run** in `studio/`:

```bash
pnpm exec sanity migration run localize-captions-and-cookie-banner --project <id> --dataset development
pnpm exec sanity migration run localize-captions-and-cookie-banner --project <id> --dataset development --no-dry-run
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

**What it does** (`main`) — moves every carousel to one `slides` list of `module.media`, in modules and in rich text. The list the web rendered is kept: with `imagesOnly` on (or unset) each plain image in `slides` becomes an image media slide without a caption; with it off, `slidesMedia` moves to `slides`. `imagesOnly` and `slidesMedia` are unset, so the hidden list's content is dropped. Carousels already in the new shape are skipped, so a re-run is safe.

**When** — merge, deploy the web and the Studio, then migrate right away. Until then a carousel in the old shape renders nothing; nothing breaks.

**Run** in `studio/`:

```bash
pnpm exec sanity migration run unify-carousel-slides --project <id> --dataset development
pnpm exec sanity migration run unify-carousel-slides --project <id> --dataset development --no-dry-run
```

---

## Related docs

- [`../README.md`](../README.md) — Studio overview and sync summary
- [`../../README.md`](../../README.md#how-reposanity-dataset-resolve-picks-a-dataset) — How the dataset is picked
- [`../.env.example`](../.env.example) — Env vars for project ID and dataset names
