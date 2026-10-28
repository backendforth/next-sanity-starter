# AGENTS.md — next-sanity-starter

> This is the canonical guardrails file for AI coding assistants (Claude Code, Cursor, Windsurf, Codex, Copilot). Read this **before** writing or changing code. Subtree `CLAUDE.md` files, `.cursor/rules/*.mdc` and `.github/copilot-instructions.md` only point here and add local gotchas this file doesn't state — keep conventions here, not in them.

## TL;DR

This is a pnpm monorepo with two apps (`web` Next.js 16 App Router, `studio` Sanity v6) and shared `packages/*`. Editorial content is rendered via a strict **module pattern**: every renderable content block is a paired `module.<name>` Sanity object **plus** a `Module<Name>.tsx` React component, wired in six places (inline use in rich text is opt-in). Multilingual content uses `sanity-plugin-internationalized-array` — locales are resolved at **render time**, never inside GROQ.

Before writing code:

1. Search for an existing module, util, snippet, or query that already does what you need.
2. If you need a new content block → it is a **module**; `pnpm gen:module <Name>` wires all 6 points.
3. After any schema or query change → run `pnpm generate`, then `pnpm typecheck`, then `pnpm format`.

## Principles (priority order — apply top-down when in doubt)

1. **Reuse before invention.** Grep `studio/schemas/objects/modules/`, `web/src/components/modules/`, `web/sanity/queries/snippets/`, `web/sanity/utils/` first.
2. **Pair or don't ship.** A schema without its component (or vice versa) is a bug, not a partial commit.
3. **All 6 wiring points or revert.** A partially wired module silently breaks the editor or the renderer. Atomic.
4. **Typegen is the only source of types for Sanity data.** Never hand-edit the generated files. Web types come from `defineQuery` results via `web/sanity/types.ts` (`ModuleOf<"module.x">`, `HomeDocument`, …) — never write a Sanity-shaped type by hand.
5. **Locale-aware at render time, not query time.** Never `coalesce(field[language=="en"]...)` in GROQ. Always resolve via `pickLocalizedString` / `pickLocalizedPortableTextBlocks`.
6. **READMEs are deep docs.** Per-folder `README.md` files are authoritative for the local pattern — link to them, do not duplicate.

## Repository map

| Path | Purpose |
|---|---|
| `web/` | Next.js 16 app (App Router). User-facing site. |
| `studio/` | Sanity Studio v6. Editorial UI + schemas. |
| `studio/netlify.toml` | Netlify pipeline for the Studio — the default hosting, a second Netlify site with package directory `studio`. The root `netlify.toml` is the web site's. |
| `packages/sanity-dataset-resolve/` | Shared dev/prod dataset resolver used by web + studio. |
| `packages/site-languages/` | The `siteLanguageSettings` projection, row rules and `en` fallback, shared by the web's routing and the Studio's language config. |
| `packages/check-wiring/` | `check:wiring`, `check:typegen` and the wiring manifest (`src/manifest.mjs`) both checks and the scaffolder use. |
| `packages/scaffold-module/` | `gen:module` — scaffolds and wires a module; `clear:modules` — empties the page stack. |
| `studio/schemas/objects/modules/` | **Schema half** of every module. |
| `web/src/components/modules/` | **Component half** of every module. |
| `web/sanity/queries/components/modules/` | GROQ projection per module. |
| `web/sanity/types.ts` | Names for the generated query types (`sanity.types.gen.ts`). Derived only. |
| `web/src/i18n/` | Locale routing, fallback config, path utils. |

## The module pattern (the most important concept)

A **module** is one content block. It exists as two halves that must always evolve together:

- **Studio half** — `defineType({ name: "module.<id>", type: "object", ... })` in `studio/schemas/objects/modules/module<Name>.ts`.
- **Web half** — a React component `Module<Name>.tsx` in `web/src/components/modules/`, rendered by `ModulesRenderer.tsx` via `_type` switch.

### 6-point wiring checklist

`pnpm gen:module <Name>` creates the files and patches every list below; `pnpm check:wiring` compares them exactly (a missing entry fails, and so does an entry without a schema). By hand, touch all six.

| # | File | What |
|---|---|---|
| 1 | `studio/schemas/objects/modules/module<Name>.ts` | `defineType` with `name: "module.<id>"`, fields, `preview`, optional `icon`. |
| 2 | `studio/schemas/index.ts` | Import + add to `schemaTypes` array. Group with other `module.*`. |
| 3 | `studio/schemas/fields/modulesArrayField.ts` | Append `{ type: "module.<id>" }` to `moduleTypes` so the module is insertable in document-level `modules[]` fields. |
| 4 | `web/src/components/modules/Module<Name>.tsx` | React component typed `module: ModuleOf<"module.<id>">`. Accept `{ module, locale, siteLocale }` (and any module-specific props). No `data-sanity` in the component: `ModulesRenderer` sets it. |
| 5 | `web/src/components/modules/ModulesRenderer.tsx` | A `case "module.<id>":` in `renderModuleChild()`. The switch on `mod`'s `_type` ends in `const unhandled: never = _type`, so a module the query returns without a `case` fails `tsc`. |
| 6 | `web/sanity/queries/components/modules/<name>.ts` | `module<Name>Query` — the GROQ projection (`_type == "module.<id>" => { ...fields }`), listed in `modulesQuery` in `queries/components/modules/index.ts`. |

Then `pnpm generate` and commit `studio/schema.json` and `web/sanity/sanity.types.gen.ts`; CI rejects a diff. The module's TS type is not a wiring point — it is `ModuleOf<"module.<id>">`, derived from the generated query types of the page stack and of rich text, so it does not depend on either.

Points 3, 5 and 6 are the **page stack**: a module editors add to a document's `modules[]` is in all three, a module that only lives inline in rich text is in none. Taking a module out of the page stack is those three lines; `check:wiring` names any left over. Every module stays in the page stack or inline: one that only lives inside another module (`module.media` without its own entries, only in a carousel's slides) gets projected to the parent's shape, keeps no `ModuleOf` type, and `check:wiring` fails it.

### Inline modules (opt-in)

A module can also be insertable inside rich text (`richTextMedia`). That is a choice per module, not a default: `module.media` and `module.carousel` are inline, `module.text` and `module.contentRefs` are not. An inline module is registered in **all three** of these places or in none — `pnpm check:wiring` fails on anything in between, and `tsc` fails when the query returns an inline type the components map doesn't handle:

1. `studio/schemas/objects/editors/richTextMedia.ts` — `{ type: "module.<id>" }` in `of`.
2. `web/sanity/queries/components/text/richTextMedia.ts` — `${module<Name>Query}` in `richTextMediaQuery`.
3. `web/src/components/text/portableTextComponents.tsx` — a `"module.<id>"` handler in `types`.

`pnpm gen:module <Name> --inline` does all three.

### DO / DON'T

| ✅ DO | ❌ DON'T |
|---|---|
| Ship schema + component + query + generated types in **one** commit. | Land a Studio schema without its web counterpart (or vice versa). |
| Render new content via `ModulesRenderer`. | Add an ad-hoc page section directly inside a page template. |
| Reuse `media.image`, `media.video`, `media.videoLoop` from `studio/schemas/objects/media/`. | Re-declare image/video field shapes inline in a new module. |
| Run `pnpm generate` after every schema or query edit. | Hand-edit `web/sanity/sanity.types.gen.ts` or `studio/schema.json`. |
| Make a module inline only when it belongs inside text, and then in all three places. | Register an inline type in one place and not the others. |
| Use `pnpm typecheck` to catch wiring drift. | Mark work "done" without typecheck + format passing. |

## Sanity data types (TypeGen) and stega

- **Queries.** Fragments are plain `const` template strings; every full query goes through `defineQuery(...)`. No function calls anywhere in a query: TypeGen skips what it can't evaluate statically, and `pnpm generate` fails on it (`check:typegen`). A singleton read by `_id` filters by type as well, `*[_type == "siteLanguageSettings" && _id == "siteLanguageSettings"][0]` — an `_id` alone gives TypeGen no document type to narrow to.
- **Types.** `web/sanity/types.ts` derives app-facing names from `web/sanity/sanity.types.gen.ts` (`ModuleOf<"module.text">`, `RichTextMediaValue`, `SiteCookieBanner`, …). Fetchers return what `sanityFetch` returns; no `as` on Sanity data. One deliberate exception: the media helpers (`sanityImageBuilder.ts`, `src/utils/muxImage.ts`) take `unknown` and check the shape at runtime, because they read several projections (image fields, posters, Mux fallbacks).
- **Stega.** In Presentation `sanityFetch` appends invisible markers to strings, and the types say so (`StegaString`). Compare such a value to a literal through `stegaClean(value)`, or narrow a union with `isStegaVariant(obj, "kind", "loop")` (`web/sanity/utils/stegaVariant.ts`). Never `stegaClean` a whole rendered document: the markers are what click-to-edit reads. Values that leave the page unrendered — metadata strings, analytics ids — are cleaned where they are used (`metadataFromSanityPageData`, the layout's `stegaClean(chrome.analytics)`).

## Where things live — decision tree

Ask yourself, in order:

1. **Is this a content block authored in Studio?** → It is a **module**. Follow the 6-point wiring.
2. **Is this a layout primitive (header, footer, container, theme toggle)?** → `web/src/components/{navigation,theme,…}/`.
3. **Is this a Sanity-only helper (slug validator, structure item, presentation resolver)?** → `studio/utils/` or `studio/config/`.
4. **Is this code or types shared by web AND studio?** → A package in `packages/*`.
5. **Is this a locale string, URL path util, or fallback config?** → `web/src/i18n/`.
6. **Is this a GROQ snippet you'll reuse across queries?** → `web/sanity/queries/snippets/`.

If a piece of code does not fit any branch, stop and ask — do not invent a new top-level folder.

## Naming

- **Modules.** Studio name `module.<id>` (lowercase, dot-separated). Web component `Module<Name>.tsx` (PascalCase). The two MUST correspond 1:1 (`module.text` ↔ `ModuleText.tsx`).
- **Studio files.** kebab-case or camelCase per existing neighbours; one `defineType` per file.
- **Web files.** PascalCase for components, camelCase for utils, kebab-case discouraged.
- **Path alias.** `@/*` resolves to `web/`. Only valid inside `web/`. Never inside `studio/` or `packages/*`.
- **Quotes / indent.** Biome enforces: tabs everywhere except `studio/*` which uses 2 spaces; double quotes throughout.

## Tooling priorities (run in this order)

After any schema or query edit:

```bash
pnpm generate              # schema extract + web typegen + check:typegen
pnpm check:wiring          # YOU MUST verify the module wiring is consistent
pnpm typecheck             # web, studio, check-wiring, scaffold-module
pnpm format                # biome check --write .
```

The pre-commit hook formats and re-stages the staged files (it refuses a file that is only partly staged); the pre-push hook runs `pnpm lint` and `typecheck`. **Don't** bypass with `--no-verify`. If a hook fails, fix the underlying issue and create a **new** commit.

**IMPORTANT — never edit:**

- `web/sanity/sanity.types.gen.ts`
- `studio/schema.json`
- Any `*.gen.*` file
- Lockfiles (`pnpm-lock.yaml`) unless you ran a dependency command

## CLI command reference

The repo has three pnpm scopes: **root** (orchestrates the monorepo), **web** (Next.js app), and **studio** (Sanity). Most root scripts forward to one or both apps.

### Root (run from repo root)

| Command | Purpose |
|---|---|
| `pnpm dev` | Start web (3000) and studio (3333) in parallel. |
| `pnpm web:dev` | Start the web app only. |
| `pnpm studio:dev` | Start the Studio only (uses `studio/scripts/dev-with-hint.mjs`). |
| `pnpm build` | Build both apps. |
| `pnpm studio:build` | Build the Studio only. |
| `pnpm studio:deploy` | Deploy the Studio to Sanity Hosting (`*.sanity.studio`, production target) — the alternative to Netlify. |
| `pnpm studio:register` | Register the Netlify-hosted Studio URL (`SANITY_STUDIO_HOSTING_URL`) with Sanity and upload the schema. Netlify production deploys run it when `SANITY_AUTH_TOKEN` is set. |
| `pnpm generate` | Studio schema extract, web query typegen, then `check:typegen`. **Run after every schema or query edit.** |
| `pnpm studio:sync-prod-to-dev` | Clone production dataset → development. |
| `pnpm typecheck` | `tsc --noEmit` in every workspace package with a `typecheck` script (web, studio, check-wiring, scaffold-module). |
| `pnpm lint` | `biome ci .`: format, lint and import order, no writes. The pre-push hook and CI run it. |
| `pnpm format` | `biome check --write .` (auto-fix). |
| `pnpm gen:module <Name>` | Scaffold a new module: creates the schema, component and query files and wires all 6 points, the `ModulesRenderer` `case` included (`--inline` also registers it in the three inline places). Writes nothing if any anchor is missing. PascalCase name. Add `--dry-run` to preview. |
| `pnpm clear:modules` | Empty the page stack before a project builds its own modules: deletes every module rich text doesn't embed (schema, component, query, and the component files only it imports) and takes the inline ones out of the three page-stack places. Writes nothing if any slot is missing. Add `--dry-run` to preview, then `pnpm generate`. |
| `pnpm check:wiring` | Compare the module schemas with the schema index, both ways, the three page-stack places and the three inline places each with each other, and fail an unused module. CI gate. |
| `pnpm check:typegen` | Every `defineQuery` in `web/sanity/` got a generated type (TypeGen skips queries it can't evaluate silently). Part of `pnpm generate`. |
| `pnpm test:tooling` | `node:test` suites for check-wiring and gen:module, including end-to-end runs of `gen:module` and `clear:modules`. CI gate. |
| `pnpm up -r` | pnpm built-in: update every workspace's dependencies within their ranges (`--latest` crosses them, `-i` picks interactively). `pnpm --filter studio up` does the Studio only. |

### web (run from `web/` or via `pnpm --filter web run …`)

| Command | Purpose |
|---|---|
| `pnpm dev` | `next dev` (Turbopack). |
| `pnpm build` | `next build`. |
| `pnpm start` | `next start` (after `build`). |
| `pnpm typecheck` | `tsc --noEmit` (web only). |
| `pnpm lint` | Biome on `web/`. |
| `pnpm format` | `biome check --write` on `web/`. |
| `pnpm generate` | `sanity typegen generate` — query types into `sanity/sanity.types.gen.ts`. Run via the root `pnpm generate`. |

### studio (run from `studio/` or via `pnpm --filter studio run …`)

| Command | Purpose |
|---|---|
| `pnpm dev` | Studio dev server via `scripts/dev-with-hint.mjs`. |
| `pnpm start` | `sanity start`. |
| `pnpm build` | `sanity build`. |
| `pnpm run deploy` | `SANITY_STUDIO_DEPLOYMENT_TARGET=production sanity deploy` (Sanity Hosting). Needs `run`: `pnpm deploy` is a pnpm built-in. |
| `pnpm register` | `node scripts/register-hosting.mjs` → `sanity deploy --external`. Pass `--dry-run` to preview. |
| `pnpm generate` | `sanity schema extract --enforce-required-fields --force` → `schema.json`, which the web typegen reads. Run via the root `pnpm generate`. |
| `pnpm sync:prod-to-dev` | Sync production dataset → dev (interactive confirmation). |
| `pnpm mux:migrate-assets` | One-off: lists Mux assets with static MP4 or premium encoding; `-- --apply` turns static MP4 off. Needs `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`. |
| `pnpm typecheck` | `tsc --noEmit` (studio only). |
| `pnpm lint` | Biome on `studio/`. |
| `pnpm format` | `biome check --write` on `studio/`. |

## i18n — the multilingual structure

The starter does **not** filter locales in GROQ. Every translatable field is an `internationalizedArray*` storing `[{ _key, language, value }]`. Locale resolution happens at React render time via `web/sanity/utils/sanityLocalizedText.ts`.

### Three-layer architecture

1. **Storage (Studio).** Translatable fields use `internationalizedArrayString`, `internationalizedArrayRichText`, or `internationalizedArrayRichTextMedia` (defined in `studio/schemas/objects/editors/`). Available languages come from the `siteLanguageSettings` singleton (`studio/schemas/settings/siteLanguageSettings.ts`) — the order of `availableLanguages[]` defines fallback priority; `defaultLanguageId` is the site default.
2. **Fetch (GROQ).** Queries project the **full** `{ _key, _type, language, value }` array. No locale parameter. Snippets in `web/sanity/queries/snippets/` already encode the correct projection — reuse them.
3. **Resolve (Render).** `web/sanity/utils/sanityLocalizedText.ts` is the single resolver. Always call into it; never index arrays directly.

### Required resolver utilities

| Utility | Use for |
|---|---|
| `pickLocalizedString(entries, locale, siteLocale)` | Single i18n string field (title, alt, label). |
| `pickLocalizedPortableTextBlocks(entries, locale, siteLocale)` | `internationalizedArrayRichText*` bodies — the block array for the locale, `[]` when empty. Embedded `module.*` objects stay untouched; their renderers resolve their own fields. |
| `pickLocalizedValue(entries, locale, siteLocale)` | Any other i18n value. All three are generic over the entry's `value`, so the generated query types come back typed. |

**Fallback chain (must-know):** exact locale → base tag (`en-US` → `en`) → `siteLocale.localeIds` in order → first non-empty entry.

### Locale flow

```
URL /[locale]/[slug]
  └─ app/[locale]/page.tsx reads `locale` from params
      └─ fetchPageBySlug(slug) — GROQ returns full i18n arrays
          └─ render({ locale, siteLocale, page })
              ├─ pickLocalizedString(page.title, locale, siteLocale)
              └─ ModulesRenderer({ locale, siteLocale, modules })
                  └─ ModuleText: pickLocalizedPortableTextBlocks(module.body, locale, siteLocale)
```

`siteLocale` (typed `SiteLocaleConfig`, defined in `web/src/i18n/fallbackSiteLocales.ts`) must be threaded into every render path. It is loaded from `siteLanguageSettings` at request time, with `FALLBACK_SITE_LOCALE_CONFIG` as the offline default.

### i18n DO / DON'T

| ✅ DO | ❌ DON'T |
|---|---|
| Project full i18n arrays in GROQ. | `coalesce(field[language=="en"].value, …)` — breaks fallback chain. |
| Read fields via `pickLocalizedString` / `pickLocalizedPortableTextBlocks` in components. | Index arrays directly (`title[0].value`, `title.find(t => t.language === locale)`). |
| Add a new language **only** by editing the `siteLanguageSettings` singleton in Studio. | Hardcode `"en"` / `"de"` outside `web/src/i18n/`. |
| Pass `{ locale, siteLocale }` as props through every render boundary. | Read the locale from `useRouter()`, `usePathname()`, `window.location` or cookies inside a module — breaks SSR and the Presentation iframe. |
| Mark translatable schema fields with `internationalizedArray*`. | Use a plain `string` or `array` field for translatable content. |
| Extend `sanityLocalizedText.ts` if a new resolver is genuinely needed. | Write a parallel ad-hoc resolver inside a component. |

## Mux video resolution

| Layer | Where | Value |
|---|---|---|
| Encoding ceiling (what Mux stores) | `options: { max_resolution_tier }` on the `mux.video` field | `media.video` **2160p**, `media.videoLoop` **1440p** |
| Plugin default | `muxInput({ max_resolution_tier })` in `studio/sanity.config.ts` | 1440p, overridden by the field options |
| Playback ceiling | `MUX_PLAYBACK_MAX_TIER` in `web/src/utils/muxPlayback.ts` | 2160p for loops and the full player |

- **Encoding is the only knob.** To give loops 4K, set `videoLoop.ts` to `"2160p"`. Leave the web ceiling alone.
- Assets uploaded before a change keep their old ladder until they are re-encoded in Mux.
- `mp4_support: "none"` stays: HLS only, no progressive MP4.

## Anti-patterns (stop if you're about to do any of these)

- Creating a one-off `<section>` directly in `app/[locale]/page.tsx` instead of a module.
- Hand-writing a type for Sanity data instead of deriving it from the generated query types (`web/sanity/types.ts`).
- Comparing a fetched string to a literal without `stegaClean` / `isStegaVariant` — it is always `false` in Presentation.
- Filtering an i18n field by language inside the query.
- Adding a language to the code fallback (`@repo/site-languages`, `en` only on purpose) instead of the Studio singleton.
- Importing from `studio/` inside `web/` or vice versa (use a `packages/*` package).
- Bypassing the pre-commit hook with `--no-verify`.
- Deleting a branch by hand while open PRs are based on it — GitHub closes them instead of retargeting. First `gh pr list --base <branch>`, then `gh pr edit <n> --base <new base>` for each.
- Editing a `*.gen.ts` file to "fix" a type error — fix the schema or the query instead.

## Cookbook

### Add a content module

1. `pnpm gen:module <Name>` (add `--inline` only if it belongs inside rich text) — or touch all 6 wiring points by hand (see table above).
2. Fill in the schema fields and the GROQ projection, then `pnpm generate` → the component's `ModuleOf<"module.<id>">` has the fields. Commit the generated files.
3. `pnpm check:wiring && pnpm typecheck && pnpm format`.

`studio/schemas/README.md` §8 "Content modules" has the Studio details.

### Start a project's own modules

1. `pnpm clear:modules --dry-run`, then `pnpm clear:modules`: `modules[]` offers nothing, the inline modules stay in rich text.
2. `pnpm generate`, `pnpm check:wiring`, `pnpm typecheck`.
3. `pnpm gen:module <Name>` for the first module; it is the page stack's only entry.

Content that already holds a deleted module shows it as an unknown type in the Studio, so run it before content goes in.

### Add a document type (page-like)

1. Define in `studio/schemas/documents/` and register in `studio/schemas/index.ts`.
2. Add a structure item under `studio/config/structure/items/` and wire into `studio/config/structure/index.ts`.
3. Decide Presentation behaviour. A slug type goes into `SLUG_BASED_DOCUMENT_TYPES` (`/:slug`) or `PREFIXED_SLUG_DOCUMENT_TYPES` (`/work/:slug`) in `studio/config/presentation/conventions.ts`. A singleton goes into `SINGLETON_PREVIEW_ROLE` in `studio/config/singletons.ts`: its role (`root`, `none`, `custom`) fills `SITE_ROOT_DOCUMENT_TYPES` / `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`; a singleton with a fixed `_id` also loses delete, unpublish and duplicate (on `variant/document-level` the per-language ones keep them). Other routes: `resolve.ts` / `locationsResolver.ts`.
4. If internally linkable, add to `studio/schemas/constants/references.ts` (`PAGE_REFERENCES`).
5. `pnpm generate` → typecheck → format.

See `studio/config/README.md` and `studio/config/structure/README.md` for details.

### Add a GROQ query

1. Read `web/sanity/queries/README.md` and `web/sanity/queries/snippets/README.md`.
2. Compose from existing snippets — do not re-write `slug`, `seo`, `link`, `media`, `modules` shapes.
3. Project i18n fields as full arrays.
4. Wrap the full query in `defineQuery`, run `pnpm generate`, and name its result in `web/sanity/types.ts` if components need it.

### Add a locale

1. Studio → **Site Language Settings** singleton → append `{ id: "<code>", title: "<Native Name>" }` to `availableLanguages`. Position controls fallback priority. Optionally update `defaultLanguageId`.
2. Add the language's fixed UI copy to `web/src/i18n/uiLabels.ts` and `web/src/i18n/cookieBannerLabels.ts`. Without it the language gets English UI text (a regional id like `de-CH` uses its base language's).
3. The Studio picks the language up on its own — `studio/config/sync/internationalizedArrayLanguages.ts` on `main`, `studio/config/sync/supportedLanguages.ts` on `variant/document-level`. No schema, query, or component change is required. If you think one is required — stop, that is an anti-pattern.

See `web/src/i18n/README.md`.

## Per-folder README index

Always link to these; never duplicate their content.

| README | Covers |
|---|---|
| `README.md` (root) | Setup from clone to production: layout, local setup, how the site works, env, deploy (staging, dataset per site, webhook), day-to-day commands. |
| `studio/README.md` | Studio architecture, schema/structure wiring. |
| `studio/schemas/README.md` | Adding schema types; module details beyond the wiring checklist. |
| `studio/config/README.md` | Structure + Presentation wiring. |
| `studio/config/structure/README.md` | Sidebar / desk structure patterns. |
| `studio/utils/README.md` | Slug validation, label utils, language sync. |
| `studio/scripts/README.md` | Dataset sync, deploy helpers. |
| `web/README.md` | Web app overview, env, locales. |
| `web/sanity/README.md` | Data-layer architecture, GROQ patterns, Presentation troubleshooting. |
| `web/sanity/queries/README.md` | Query organisation (pages vs components vs snippets). |
| `web/sanity/queries/snippets/README.md` | Reusable GROQ snippets. |
| `web/sanity/queries/components/README.md` | Per-component projections. |
| `web/sanity/queries/pages/README.md` | Per-route projections. |
| `web/src/i18n/README.md` | i18n internals, locale flow, language settings. |
| `web/src/assets/styles/README.md` | Tailwind v4 token setup. |
| `web/src/assets/styles/tailwind/README.md` | Tailwind config split. |
| `web/src/assets/fonts/README.md` | Font loading conventions. |
| `packages/check-wiring/README.md` | What `check:wiring` and `check:typegen` check; the wiring manifest. |
| `packages/scaffold-module/README.md` | `gen:module` usage, templates, tests. |

## Branch-specific notes

Both `main` and `variant/document-level` ship this file. The two branches have converged on the whole structural surface — document types, module set, the six wiring points, query/type layout and barrels are **identical**. Exactly one thing differs by design: where a locale lives — in the field (`main`) or in the document (`variant`). Every row below is that difference or follows from it.

**Verify before you trust this table.** It has been wrong in both directions: it described a much wider divergence for months after the branches had converged, and later claimed the variant still used `internationalizedArray*` fields when it had moved to plain ones (corrected 2026-10-13). If a row here contradicts the branch you are on, the branch wins — fix the row.

| Aspect | `main` | `variant/document-level` |
|---|---|---|
| Where the locale lives | In the field. One document per page; translatable fields are `internationalizedArray*` (`[{ _key, language, value }]`). | In the document. One document per language; every translatable document type (`TRANSLATABLE_SCHEMA_TYPES` in `studio/sanity.config.ts`: `page`, `project`, `projectCategory`, `work`, `home`, `siteSettings`, `siteNav`, `errorSettings`, `siteCookieBanner`) has a `language` string field (`readOnly`, `hidden`, initial value `siteLanguageSettings.defaultLanguageId`) set by the plugin — **never edit it manually**. Content fields are plain (`string`, `richText`, `richTextMedia`). |
| Studio plugin | `sanity-plugin-internationalized-array`, languages from `studio/config/sync/internationalizedArrayLanguages.ts`. | `@sanity/document-internationalization`, languages from `studio/config/sync/supportedLanguages.ts`; translations are linked through `translation.metadata` documents. |
| GROQ | No locale parameter; singletons by type and `_id` (`*[_type == "siteSettings" && _id == "siteSettings"][0]`). The "never filter locale in GROQ" rule applies here. | Queries select the document for the route's language and take `$locale` (`*[_type == "siteSettings" && language == $locale][0]`). Selecting by `language` is the design here, not the anti-pattern. |
| Render-time resolution | Every translatable field through `sanityLocalizedText.ts` (`pickLocalizedString` / `pickLocalizedPortableTextBlocks` / `pickLocalizedValue`). | Fields already hold the route's language; render them directly. Only `resolveLinkLabel` still resolves localized arrays: a dataset shared with `main` holds main-shaped documents a link can point at. |
| Shared singletons | `siteLanguageSettings` (both branches) and `siteAnalyticsSettings` are global singletons addressed by `_id`. | Same. |
| Layout chrome | `app/[locale]/layout.tsx` fetches the chrome bundle (`fetchSiteChrome`: nav, cookie banner, site settings, analytics, 404 copy) in parallel with the locale check. | Fetches it (`fetchSiteChrome(locale)`) after `isAppLocale(locale)`: the bundle is per language, so its cache key needs a validated locale. |

Everything else — `page`/`project`/`projectCategory`/`work`, all four `module.*` schemas, all four web renderers under `web/src/components/modules/`, flat `queries/components/modules/<name>.ts` with the barrel, the route paths from `queries/snippets/routePath.ts` (a deleted or unpublished link target renders without a link), the derived `web/sanity/types.ts`, the wiring tooling in `packages/` (only the `scaffold-module` templates follow the branch's field types), and the inline-module set (`module.media` + `module.carousel` on both) — is the same on both branches. Treat a difference you find there as **drift to be reconciled**, not as intended divergence.

### Variant-branch rules

- The `language` field on every translatable document type is set by the i18n plugin; **do not edit, hide, expose, or remove it**. New documents get it from the plugin's "create translation" action, else start in the default language.
- Anything reading a per-language document (`home`, `work`, `page`, `project`, `projectCategory`, `siteSettings`, `siteNav`, `errorSettings`, `siteCookieBanner`) needs the `$locale` param on this branch. Porting such a query from `main` means adding the `language == $locale` filter, not copying the `_id` lookup.
- A field that is `internationalizedArray*` on `main` is plain on this branch: drop the `pickLocalizedString` call in the port, render the value directly.
- Web fixes authored on `main` are expected to apply here with context conflicts only. If a port looks structural, re-check against the branch before adapting — the divergence table above has been wrong in that direction before.

### Porting fixes between branches

Fixes land on `main` first and reach the variant by `git cherry-pick -x`, as their own PR. Every PR names its counterpart in the description — the PR template asks for it:

- On a `main` PR: `Variant-Port: #<PR>`, or `Variant-Port: n/a` with the reason (main-only i18n code, a workflow that runs from `main` only).
- On a variant PR: `Variant-Port: #<main PR>` for a port, `Variant-Port: variant-only` otherwise.

Without that line, ten fixes from #182, #190 and #191 reached only `main` in 2026-10.

### Updating conventions on both branches

`AGENTS.md` and `.github/copilot-instructions.md` are identical on both branches — the notes above describe both, and the Copilot file stays branch-neutral. The other mirrors are not: the root and subtree `CLAUDE.md` files and `.cursor/rules/*.mdc` carry the variant's document-level i18n rules on `variant/document-level`. Each mirror keeps its i18n-model statements on lines of their own that start with `i18n:`, so a port swaps those lines and takes the rest from `main`. Carry a change over by cherry-picking it, never by copying files from `main` — a copy silently overwrites those variant rules.

1. Edit `AGENTS.md` on `main` (a mirror only when its local gotcha changes) and commit.
2. On `variant/document-level`: `git cherry-pick -x <commit>`.
3. Resolve conflicts in the mirrors by keeping the variant's `i18n:` lines and taking everything else from `main`. A conflict outside the i18n lines is drift — reconcile it.
4. Re-read the notes above and fix a row if the branch contradicts it.
5. Once both are merged, `git diff main variant/document-level -- AGENTS.md .github/copilot-instructions.md` must be empty.

## Projects built from this starter

A client project starts as a copy of one starter branch without its history and lives on from there. This section is for the copy; the starter itself has no staging branch.

### "This repository" block

Right under the title of the copy's `AGENTS.md`, add this block filled in, so every agent reads the overrides first. Keep the i18n line only in a copy of `variant/document-level`.

```markdown
## This repository

<project> is <what it is>, copied from `backendforth/next-sanity-starter` at `<branch>` `<commit>` (<date>) without its history. The rest of this file is the starter's and describes both starter branches. Read it with these overrides:

- **i18n is document-level.** Wherever this file states the field-level model (TL;DR, principle 5, "i18n — the multilingual structure", the definition of done), the `variant/document-level` column of "Branch-specific notes" and "Variant-branch rules" win: one document per language, queries filter `language == $locale`, content fields are plain.
- **Two long-lived branches: `main` (production) and `development` (staging).** See "Branches in a project". There is no variant branch to port to, and PRs carry no `Variant-Port` line.
- **Starter changes arrive by cherry-pick.** There is no shared history with the starter, so `git merge` cannot be used. See "Syncing from the starter".
```

### Branches in a project

- `main` is production: Netlify production deploys of the web and the Studio project, on the `production` dataset.
- `development` is staging: a Netlify branch deploy on both projects, on the `development` dataset. Branch deploys pick that dataset without a setting (README → "Datasets").
- Feature branches start from `development` and merge back into it by PR. A release is a PR from `development` into `main`.
- Dependabot reads its config from the default branch, `main`, and opens its PRs there. After merging one, merge `main` back into `development`.
- CI runs on every PR and on pushes to `main` and `development`.

### Syncing from the starter

1. `git fetch starter <branch>`. Once per clone, add the remote before the first fetch: `git remote add starter https://github.com/backendforth/next-sanity-starter.git`.
2. `git log --oneline <anchor>..starter/<branch>` lists what is new; the anchor is the starter commit in "This repository".
3. On a branch from `development`, `git cherry-pick -x` what applies. Skip commits that only concern the starter's two-branch process.
4. Open the PR against `development` and move the anchor in "This repository" in the same PR.

## Definition of done

Before declaring a task complete, all of the following must hold:

- [ ] `pnpm typecheck` passes (web, studio, tooling packages).
- [ ] `pnpm format` produces no diff.
- [ ] `pnpm generate` (after schema or query edits) produces no uncommitted diff.
- [ ] `pnpm check:wiring` passes; for a new/renamed module all 6 wiring points land in the same commit as the schema.
- [ ] No edits to `*.gen.*` files.
- [ ] No `--no-verify` commits, no `coalesce(...language==...)` GROQ, no hardcoded locale literals outside `web/src/i18n/`.
- [ ] In the starter, the PR description names its `Variant-Port` (see "Porting fixes between branches").
