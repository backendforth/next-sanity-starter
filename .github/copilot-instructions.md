# GitHub Copilot — repository instructions

Full guardrails live in `AGENTS.md` at the repo root. This file is a condensed mirror for inline suggestions.

## Repo at a glance

- pnpm monorepo: `web` (Next.js 16 App Router), `studio` (Sanity v5), shared `packages/*`.
- Editorial content is rendered via the **module pattern**: every content block is a paired `module.<name>` Sanity object + `Module<Name>.tsx` React component, wired in 8 places.
- Multilingual content uses `@sanity/internationalized-array`. Locale is resolved at **render time** via `web/sanity/utils/sanityLocalizedText.ts`, never inside GROQ.

## Top rules

1. Reuse before invention — check `studio/schemas/objects/modules/`, `web/src/components/modules/`, `web/sanity/queries/snippets/`, `web/sanity/utils/` first.
2. New content block → it is a **module**. Touch all 8 wiring points or revert:
   - `studio/schemas/objects/modules/module<Name>.ts`
   - `studio/schemas/index.ts`
   - `studio/schemas/objects/editors/richTextMedia.ts`
   - `studio/schemas/fields/modulesArrayField.ts`
   - `web/src/components/modules/Module<Name>.tsx`
   - `web/src/components/modules/index.ts` (+ register in `ModulesRenderer.tsx`)
   - `web/sanity/queries/components/modules/<name>.ts` (+ barrel)
   - `web/sanity/types/modules/<name>.ts` (+ barrel)
3. After every schema edit: `pnpm studio:generate`, then `pnpm typecheck`, then `pnpm format`.
4. Never edit `studio/sanity.types.gen.ts` or `studio/schema.json` — generated.
5. `web/sanity/types/*` are hand-maintained — update them when schema fields change.
6. Locale-aware always: use `pickLocalizedString(field, locale, siteLocale)` or `parseLocalizedText({ value, locale, siteLocale, as })`. Never `field[0].value` or `field.find(t => t.language === locale)`. Never `coalesce(field[language==$locale].value, ...)` in GROQ.
7. Add a new language only via the `siteLanguageSettings` Studio singleton (offline fallback: `web/src/i18n/fallbackSiteLocales.ts`). No schema, query, or component change.
8. No hardcoded locale codes outside `web/src/i18n/`.
9. No imports from `studio/` inside `web/` (or vice versa). Share via `packages/*`.

## Naming

- Sanity module name `module.<id>` ↔ React component `Module<Name>.tsx`.
- Path alias `@/*` resolves to `web/` only.
- Biome: tabs (web + root), 2 spaces (studio), double quotes throughout.

## Decision tree — where things live

- Authored content block? → module.
- Layout primitive (header, footer, container)? → `web/src/components/{navigation,theme,…}/`.
- Sanity-only helper? → `studio/utils/` or `studio/config/`.
- Shared between web + studio? → a package in `packages/*`.
- Locale string / URL helper? → `web/src/i18n/`.
- Reusable GROQ fragment? → `web/sanity/queries/snippets/`.

## Branches

The repo has two long-lived branches with non-trivial differences:

- `main` — document types `page`, `project`, `projectCategory`, `work`; four web module renderers all under `web/src/components/modules/` with an `index.ts` barrel; `module.contentRefs` schema supports project filtering.
- `variant/document-level` — only `page` (no projects/work); all four module schemas exist but only `ModuleMedia` and `ModuleText` have local renderers — `ModuleCarousel` lives in `web/src/components/carousel/`, `ModuleContentRefs` has a dev-only placeholder. No `web/src/components/modules/index.ts` barrel. `module.contentRefs` is simplified to `PAGE_REFERENCES` with an `allowMultiple` toggle. `page` has a `language` string field set by the i18n plugin — **never edit manually**.

Check `git rev-parse --abbrev-ref HEAD` and the actual file layout on the branch before adding modules.

## Definition of done

`pnpm typecheck` passes, `pnpm format` clean, gen artifacts committed if schema changed, all 8 module wiring points touched (when applicable), no `--no-verify`.
