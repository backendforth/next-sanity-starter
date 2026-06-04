# @repo/scaffold-module

Scaffolds a new content module across **all 8 wiring points** of the module pattern documented in [`/AGENTS.md`](../../AGENTS.md).

## Usage

From the repo root:

```bash
pnpm gen:module <PascalCaseName>          # apply the scaffold
pnpm gen:module <PascalCaseName> --dry-run  # preview without writing
pnpm gen:module <PascalCaseName> --inline   # also register as an inline Portable Text block
```

The name must be PascalCase (`Hero`, `Quote`, `VideoStrip`). Lowercase derivations are computed automatically.

## What it does

Creates four new files:

| File | Wiring point |
|---|---|
| `studio/schemas/objects/modules/module<Name>.ts` | 1 |
| `web/src/components/modules/Module<Name>.tsx` | 5 |
| `web/sanity/queries/components/modules/<name>.ts` | 7 |
| `web/sanity/types/modules/<name>.ts` | 8 |

Patches four existing files (using exact-string anchors near the existing module entries):

| File | Wiring point |
|---|---|
| `studio/schemas/index.ts` (import + `schemaTypes`) | 2 |
| `studio/schemas/fields/modulesArrayField.ts` (`moduleTypes`) | 4 |
| `web/src/components/modules/index.ts` (barrel) | 6 |
| `web/sanity/queries/components/modules/index.ts` (barrel + `modulesQuery`) | 7 |
| `web/sanity/types/modules/index.ts` (barrel + `ContentModule` union) | 8 |

Optionally patches `studio/schemas/objects/editors/richTextMedia.ts` (wiring point 3) when `--inline` is passed. Off by default — only enable for modules that genuinely make sense inside Portable Text.

## What it does NOT do

`web/src/components/modules/ModulesRenderer.tsx` is **not** auto-edited because its dispatch logic is bespoke. The script prints the exact snippet to paste in.

## After running

```bash
pnpm studio:generate     # regenerate schema.json + sanity.types.gen.ts
pnpm check:wiring        # verify all 8 points
pnpm typecheck
pnpm format
```

## Templates

Templates live in `templates/`. They use `__MODULE_NAME__`, `__MODULE_TITLE__`, `__MODULE_VAR__`, `__MODULE_QUERY_VAR__`, `__MODULE_DATA_TYPE__`, `__MODULE_COMPONENT__`, and `__MODULE_FILE_BASE__` placeholders.

## Failure modes

If the anchor strings in the existing files have changed (e.g. a previous refactor reordered imports), the script aborts with an error pointing at the missing anchor. Fix the anchors or re-author the script's `patch()` calls — partial inserts are rejected to avoid corrupted barrels.
