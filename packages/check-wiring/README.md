# @repo/check-wiring

Validates that every module declared under `studio/schemas/objects/modules/` is wired across all 8 points of the module pattern documented in [`/AGENTS.md`](../../AGENTS.md).

## Usage

From the repo root:

```bash
pnpm check:wiring
```

Exits 0 when every module is fully wired. Exits 1 with a per-module report when drift is found.

## Designed for both branches

The repo has two long-lived branches with slightly different module layouts (see `AGENTS.md §Branch-specific notes`). The checker treats branch-specific divergences as **skips**, not failures:

- Missing `web/src/components/modules/index.ts` barrel (variant/document-level) → barrel check skipped.
- Missing `web/src/components/modules/Module<Name>.tsx` is tolerated when `ModulesRenderer.tsx` defines a `Module<Name>Placeholder` (variant's ContentRefs is intentionally a placeholder).
- A module not registered as an inline block in `richTextMedia.ts` is reported as a **warning**, not a failure — many modules don't make sense inline.

## What it checks

| # | Point | Failure mode |
|---|---|---|
| 1 | `studio/schemas/objects/modules/module<Name>.ts` with valid `name: "module.<id>"` and `export const module<Name>`. | Source of truth — if missing, the module isn't picked up at all. |
| 2 | `studio/schemas/index.ts` imports and re-exports the schema in `schemaTypes`. | Schema is invisible to Studio/APIs without this. |
| 3 | `studio/schemas/objects/editors/richTextMedia.ts` includes the type — **optional**, warned. | Editors can't insert inline if needed. |
| 4 | `studio/schemas/fields/modulesArrayField.ts` includes the type. | Editors can't add the module to document-level `modules[]`. |
| 5 | `web/src/components/modules/Module<Name>.tsx` OR a `Module<Name>Placeholder` in `ModulesRenderer.tsx`. | Renderer falls through to `UnknownModule`. |
| 6 | Components barrel re-exports the component — **skipped on branches without a barrel**. | Stale imports drift silently. |
| 7 | `web/sanity/queries/components/modules/<name>.ts` exists and the barrel references the `module<Name>Query` const. | Query returns no projection for the module's fields. |
| 8 | `web/sanity/types/modules/<name>.ts` exists and the barrel references `Module<Name>Data`. | TypeScript loses the union member; `mod as Module<Name>Data` silently `any`s. |

## CI

The script is wired into the format/typecheck workflow on the workspace root. Pre-push and pre-commit hooks deliberately stay narrow (`format` + `typecheck`) — wiring drift is a separate signal best handled at PR time.
