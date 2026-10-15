# @repo/scaffold-module

Scaffolds a new content module and wires it at every point of the module pattern in [`/AGENTS.md`](../../AGENTS.md).

## Usage

From the repo root:

```bash
pnpm gen:module <PascalCaseName>            # scaffold and wire
pnpm gen:module <PascalCaseName> --dry-run  # list the changes, write nothing
pnpm gen:module <PascalCaseName> --inline   # also make it insertable in rich text
```

The name must be PascalCase (`Hero`, `Quote`, `VideoStrip`).

## What it does

Creates three files from `templates/`:

| File | |
|---|---|
| `studio/schemas/objects/modules/module<Name>.ts` | schema with an i18n `title` |
| `web/src/components/modules/Module<Name>.tsx` | component typed `module: ModuleOf<"module.<id>">` |
| `web/sanity/queries/components/modules/<name>.ts` | `module<Name>Query` projection |

Adds the module to every list slot of the wiring manifest (`@repo/check-wiring/manifest`, the same slots `pnpm check:wiring` reads): `schemas/index.ts`, `moduleTypes`, the components barrel, a `case` in `ModulesRenderer`, `modulesQuery`. With `--inline` also the three inline places: the Studio's `richTextMedia` `of`, `richTextMediaQuery` and the `types` map in `portableTextComponents.tsx`. Inline is opt-in — use it only for a module that belongs inside text.

Every change is computed before anything is written. A missing anchor, an existing file or a slot that already lists the module aborts with nothing written; a failed write rolls back what was written. Touched files are formatted with Biome.

## After running

```bash
pnpm generate        # schema + TypeGen — the component's ModuleOf<…> gets its fields
pnpm check:wiring
pnpm typecheck
```

## Templates

`templates/*.tmpl` use `__MODULE_NAME__` (`module.hero`), `__MODULE_TITLE__` (`Hero`), `__MODULE_VAR__` (`moduleHero`), `__MODULE_QUERY_VAR__` (`moduleHeroQuery`) and `__MODULE_COMPONENT__` (`ModuleHero`).

## Tests

`test/scaffold.e2e.test.mjs` (run by `pnpm test:tooling`) scaffolds `Hero` and `Quote --inline` into a copy of the checkout and runs both typegens, `check:typegen`, `check:wiring` and `tsc` for web and studio; a second test checks that a missing anchor writes nothing.
