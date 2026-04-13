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

**Commands**

| Where | Command |
|-------|---------|
| `studio/` | `pnpm run sync:prod-to-dev` |
| Repo root | `pnpm studio:sync-prod-to-dev` |
| Skip prompt | `pnpm run sync:prod-to-dev -- --yes` |

**Artifacts**

- Default export path: **`studio/.sync-tmp/prod-to-dev-export.tar.gz`** (ignored by git). You can delete or inspect it after a successful run.

---

## Related docs

- [`../README.md`](../README.md) — Studio overview and sync summary
- [`../utils/README.md`](../utils/README.md) — How dataset resolution works in the Studio app
- [`../.env.example`](../.env.example) — Env vars for project ID and dataset names
