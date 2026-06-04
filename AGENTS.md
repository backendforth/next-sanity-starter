# AGENTS.md — next-sanity-starter

> This is the canonical guardrails file for AI coding assistants (Claude Code, Cursor, Windsurf, Codex, Copilot). Read this **before** writing or changing code. Per-subtree `CLAUDE.md`, `.cursor/rules/*.mdc`, and `.github/copilot-instructions.md` all defer to this document — keep edits here, not in mirrors.

## TL;DR

This is a pnpm monorepo with two apps (`web` Next.js 16 App Router, `studio` Sanity v5) and shared `packages/*`. Editorial content is rendered via a strict **module pattern**: every renderable content block is a paired `module.<name>` Sanity object **plus** a `Module<Name>.tsx` React component, wired in eight places. Multilingual content uses `@sanity/internationalized-array` — locales are resolved at **render time**, never inside GROQ.

Before writing code:

1. Search for an existing module, util, snippet, or query that already does what you need.
2. If you need a new content block → it is a **module**; wire all 8 points or revert.
3. After any schema change → run `pnpm studio:generate`, then `pnpm typecheck`, then `pnpm format`.

## Principles (priority order — apply top-down when in doubt)

1. **Reuse before invention.** Grep `studio/schemas/objects/modules/`, `web/src/components/modules/`, `web/sanity/queries/snippets/`, `web/sanity/utils/` first.
2. **Pair or don't ship.** A schema without its component (or vice versa) is a bug, not a partial commit.
3. **All 8 wiring points or revert.** A partially wired module silently breaks the editor or the renderer. Atomic.
4. **Typegen is the source of truth for Studio types.** Never hand-edit `studio/sanity.types.gen.ts` or `studio/schema.json`. `web/sanity/types/*` are hand-maintained for now — keep them aligned with schema field changes.
5. **Locale-aware at render time, not query time.** Never `coalesce(field[language=="en"]...)` in GROQ. Always resolve via `pickLocalizedString` / `parseLocalizedText`.
6. **READMEs are deep docs.** Per-folder `README.md` files are authoritative for the local pattern — link to them, do not duplicate.

## Repository map

| Path | Purpose |
|---|---|
| `web/` | Next.js 16 app (App Router). User-facing site. |
| `studio/` | Sanity Studio v5. Editorial UI + schemas. |
| `packages/sanity-dataset-resolve/` | Shared dev/prod dataset resolver used by web + studio. |
| `packages/strip-readmes/` | CLI to clean READMEs when shipping a downstream fork. |
| `studio/schemas/objects/modules/` | **Schema half** of every module. |
| `web/src/components/modules/` | **Component half** of every module. |
| `web/sanity/queries/components/modules/` | GROQ projection per module. |
| `web/sanity/types/modules/` | Hand-maintained TS shapes per module. |
| `web/src/i18n/` | Locale routing, fallback config, path utils. |

## The module pattern (the most important concept)

A **module** is one content block. It exists as two halves that must always evolve together:

- **Studio half** — `defineType({ name: "module.<id>", type: "object", ... })` in `studio/schemas/objects/modules/module<Name>.ts`.
- **Web half** — a React component `Module<Name>.tsx` in `web/src/components/modules/`, rendered by `ModulesRenderer.tsx` via `_type` switch.

### 8-step wiring checklist

When you add or rename a module, **touch all eight** files. Skipping any one silently breaks either the editor experience or the renderer.

| # | File | What |
|---|---|---|
| 1 | `studio/schemas/objects/modules/module<Name>.ts` | `defineType` with `name: "module.<id>"`, fields, `preview`, optional `icon`. |
| 2 | `studio/schemas/index.ts` | Import + add to `schemaTypes` array. Group with other `module.*`. |
| 3 | `studio/schemas/objects/editors/richTextMedia.ts` | Append `{ type: "module.<id>" }` to the `of` array so the module is insertable in Portable Text. |
| 4 | `studio/schemas/fields/modulesArrayField.ts` | Append `{ type: "module.<id>" }` to `moduleTypes` so the module is insertable in document-level `modules[]` fields. |
| 5 | `web/src/components/modules/Module<Name>.tsx` | React component. Accept `{ data, locale, siteLocale }` (and any module-specific props). Use `data-sanity` attrs for Visual Editing. |
| 6 | `web/src/components/modules/index.ts` | Re-export the component from the barrel. |
| 7 | `web/sanity/queries/components/modules/<name>.ts` | GROQ projection for the module (`_key, _type, ...fields`). Re-export from `web/sanity/queries/components/modules/index.ts`. |
| 8 | `web/sanity/types/modules/<name>.ts` | Hand-written TS type matching the GROQ projection. Re-export from `web/sanity/types/modules/index.ts`. |

After step 1–4 land, run `pnpm studio:generate` and commit `studio/schema.json` + `studio/sanity.types.gen.ts`. CI rejects a diff.

### DO / DON'T

| ✅ DO | ❌ DON'T |
|---|---|
| Ship schema + component + query + type in **one** commit. | Land a Studio schema without its web counterpart (or vice versa). |
| Render new content via `ModulesRenderer`. | Add an ad-hoc page section directly inside a page template. |
| Reuse `media.image`, `media.video`, `media.videoLoop` from `studio/schemas/objects/media/`. | Re-declare image/video field shapes inline in a new module. |
| Run `pnpm studio:generate` after every schema edit. | Hand-edit `studio/sanity.types.gen.ts` or `studio/schema.json`. |
| Keep `richTextMedia.ts` and `modulesArrayField.ts` in sync (same module set). | Restrict a module to only one of the two unless explicitly intended. |
| Use `pnpm typecheck` to catch wiring drift. | Mark work "done" without typecheck + format passing. |

## Where things live — decision tree

Ask yourself, in order:

1. **Is this a content block authored in Studio?** → It is a **module**. Follow the 8-step wiring.
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

After any schema edit:

```bash
pnpm studio:generate       # regenerate studio/schema.json + studio/sanity.types.gen.ts
pnpm typecheck             # web + studio
pnpm format                # biome check --write .
```

Pre-commit / pre-push hooks already run `format` and `typecheck`. Don't bypass with `--no-verify`. If a hook fails, fix the underlying issue and create a **new** commit.

**Never edit:**

- `studio/sanity.types.gen.ts`
- `studio/schema.json`
- Any `*.gen.*` file
- Lockfiles (`pnpm-lock.yaml`) unless you ran a dependency command

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
| `parseLocalizedText({ value, locale, siteLocale, as })` | Polymorphic: `as: "auto" \| "string" \| "blocks"` — handles string or Portable Text. |
| `resolveLocalizedPortableTextDeep(entries, locale, siteLocale)` | Portable Text with embedded i18n fields (used inside RichTextMedia + modules in rich text). |

**Fallback chain (must-know):** exact locale → base tag (`en-US` → `en`) → `siteLocale.localeIds` in order → first non-empty entry.

### Locale flow

```
URL /[locale]/[slug]
  └─ app/[locale]/page.tsx reads `locale` from params
      └─ fetchPageBySlug(slug) — GROQ returns full i18n arrays
          └─ render({ locale, siteLocale, page })
              ├─ pickLocalizedString(page.title, locale, siteLocale)
              └─ ModulesRenderer({ locale, siteLocale, modules })
                  └─ ModuleText: parseLocalizedText({ value: body, locale, siteLocale, as: "blocks" })
```

`siteLocale` (typed `SiteLocaleConfig`, defined in `web/src/i18n/fallbackSiteLocales.ts`) must be threaded into every render path. It is loaded from `siteLanguageSettings` at request time, with `FALLBACK_SITE_LOCALE_CONFIG` as the offline default.

### i18n DO / DON'T

| ✅ DO | ❌ DON'T |
|---|---|
| Project full i18n arrays in GROQ. | `coalesce(field[language=="en"].value, …)` — breaks fallback chain. |
| Read fields via `pickLocalizedString` / `parseLocalizedText` in components. | Index arrays directly (`title[0].value`, `title.find(t => t.language === locale)`). |
| Add a new language **only** by editing the `siteLanguageSettings` singleton in Studio. | Hardcode `"en"` / `"de"` outside `web/src/i18n/`. |
| Pass `{ locale, siteLocale }` as props through every render boundary. | Read locale from `useRouter()` inside a module — breaks SSR + Visual Editing. |
| Mark translatable schema fields with `internationalizedArray*`. | Use a plain `string` or `array` field for translatable content. |
| Extend `sanityLocalizedText.ts` if a new resolver is genuinely needed. | Write a parallel ad-hoc resolver inside a component. |

## Anti-patterns (stop if you're about to do any of these)

- Creating a one-off `<section>` directly in `app/[locale]/page.tsx` instead of a module.
- Hand-writing a Sanity-shaped type without a matching GROQ projection.
- Filtering an i18n field by language inside the query.
- Adding a language by editing `fallbackSiteLocales.ts` only and forgetting the Studio singleton.
- Importing from `studio/` inside `web/` or vice versa (use a `packages/*` package).
- Bypassing the pre-commit hook with `--no-verify`.
- Editing `studio/sanity.types.gen.ts` to "fix" a type error — fix the schema or the hand type instead.

## Cookbook

### Add a content module

1. Read `studio/schemas/README.md` §8 "Content modules" — it has the canonical narrative.
2. Touch all 8 wiring points (see table above).
3. `pnpm studio:generate` → commit gen artifacts.
4. `pnpm typecheck && pnpm format`.

### Add a document type (page-like)

1. Define in `studio/schemas/documents/` and register in `studio/schemas/index.ts`.
2. Add a structure item under `studio/config/structure/items/` and wire into `studio/config/structure/index.ts`.
3. Decide Presentation behaviour — touch `studio/config/presentation/conventions.ts` (`SLUG_BASED_DOCUMENT_TYPES`, `SITE_ROOT_DOCUMENT_TYPES`, `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`) and `resolve.ts` / `locationsResolver.ts` as needed.
4. If internally linkable, add to `studio/schemas/constants/references.ts` (`PAGE_REFERENCES`).
5. `pnpm studio:generate` → typecheck → format.

See `studio/config/README.md` and `studio/config/structure/README.md` for details.

### Add a GROQ query

1. Read `web/sanity/queries/README.md` and `web/sanity/queries/snippets/README.md`.
2. Compose from existing snippets — do not re-write `slug`, `seo`, `link`, `media`, `modules` shapes.
3. Project i18n fields as full arrays.
4. Add a matching hand type in `web/sanity/types/` if the query returns a new shape.

### Add a locale

1. Studio → **Site Language Settings** singleton → append `{ id: "<code>", title: "<Native Name>" }` to `availableLanguages`. Position controls fallback priority. Optionally update `defaultLanguageId`.
2. `web/src/i18n/fallbackSiteLocales.ts` → extend `FALLBACK_SITE_LOCALE_CONFIG.localeIds` and `languages` in the same order (offline fallback only).
3. Studio language tabs appear automatically via `studio/config/sync/internationalizedArrayLanguages.ts`. No schema, query, or component change is required. If you think one is required — stop, that is an anti-pattern.

See `web/src/i18n/README.md`.

## Per-folder README index

Always link to these; never duplicate their content.

| README | Covers |
|---|---|
| `README.md` (root) | Project overview, monorepo layout. |
| `studio/README.md` | Studio architecture, schema/structure wiring. |
| `studio/schemas/README.md` | Adding schemas + the canonical module checklist. |
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

## Branch-specific notes

Both `main` and `variant/document-level` ship this file. The convention surface is largely identical but key wiring differs. **Always check the active branch (`git rev-parse --abbrev-ref HEAD`) before touching modules, queries, or document types.**

| Aspect | `main` | `variant/document-level` |
|---|---|---|
| Document types | `page`, `project`, `projectCategory`, `work` (+ `home`, settings singletons) | `page` only (+ `home`, settings singletons) |
| Module schemas (Studio) | All four: `module.media`, `module.text`, `module.carousel`, `module.contentRefs` | All four exist as schemas |
| Web module renderers | `ModuleMedia`, `ModuleText`, `ModuleCarousel`, `ModuleContentRefs` (+ Client) — all under `web/src/components/modules/`, registered in `web/src/components/modules/index.ts` (barrel) | `ModuleMedia`, `ModuleText` under `web/src/components/modules/`; `ModuleCarousel` lives in `web/src/components/carousel/` (dynamic-imported); `ModuleContentRefs` has a **dev-only placeholder** in `ModulesRenderer.tsx` ("no frontend renderer yet"). **No `index.ts` barrel** for modules. |
| `module.contentRefs` schema | `sourceScope` toggles between `PAGE_REFERENCES` / `PROJECT_REFERENCES` / both; project filter UI; `showProjectFilters`, `selection`. | Simplified: `allowMultiple` toggle, `reference` (single) or `references` (array), `PAGE_REFERENCES` only. |
| `richTextMedia.ts` inline modules | `module.media`, `module.carousel`, `module.text`, `module.contentRefs` (mirrors `modulesArrayField`) | Only `module.media` and `module.carousel` — narrower than `modulesArrayField` on purpose. |
| Document-level locale field | None — i18n is purely field-level via `internationalizedArray*`. | `page` has a `language` string field (`readOnly: true`, `hidden: true`, `initialValue: "en"`) set by the i18n plugin, **never edit it manually**. Title, module bodies, and other content fields still use `internationalizedArray*` and resolve through `sanityLocalizedText.ts` exactly as on `main`. |
| Query/type layout | Flat files under `web/sanity/queries/components/modules/<name>.ts` + `web/sanity/types/modules/<name>.ts` with barrels. | Subfolder structure under `web/sanity/queries/components/modules/` and `web/sanity/types/modules/`; consult the directory layout on the branch before adding files. |

### Variant-branch rules

- **Never** reference `project`, `projectCategory`, or `work` from queries or components — those document types do not exist.
- The `page.language` field is set programmatically by the i18n plugin; **do not edit, hide, expose, or remove it**. New page documents inherit it from `initialValue`.
- When adding a renderer for `module.contentRefs`, replace the dev-only placeholder in `ModulesRenderer.tsx` — the schema already exists.
- When adding a web module, follow the on-branch convention: do **not** recreate `web/src/components/modules/index.ts` unless you also rewrite `ModulesRenderer.tsx` to import through it. The renderer currently imports module components directly.
- Check `web/sanity/queries/components/modules/` and `web/sanity/types/modules/` for the actual subfolder layout before adding files — it differs from `main`.

### Updating conventions on both branches

1. Edit `AGENTS.md` (+ mirrors) on `main`.
2. Commit and merge.
3. `git checkout variant/document-level && git checkout main -- AGENTS.md CLAUDE.md web/CLAUDE.md studio/CLAUDE.md studio/schemas/objects/modules/CLAUDE.md web/src/components/modules/CLAUDE.md web/sanity/CLAUDE.md .cursor/rules/ .github/copilot-instructions.md`.
4. Re-read this section and adjust if a real divergence appeared.
5. Commit on `variant/document-level`.

## Definition of done

Before declaring a task complete, all of the following must hold:

- [ ] `pnpm typecheck` passes (web + studio).
- [ ] `pnpm format` produces no diff.
- [ ] `pnpm studio:generate` (after schema edits) produces no uncommitted diff.
- [ ] For a new/renamed module: all 8 wiring points touched, schema + component land in the same commit.
- [ ] For i18n changes: `siteLanguageSettings` singleton updated **before** `fallbackSiteLocales.ts`, never the reverse-only.
- [ ] No edits to `*.gen.*` files.
- [ ] No `--no-verify` commits, no `coalesce(...language==...)` GROQ, no hardcoded locale literals outside `web/src/i18n/`.
