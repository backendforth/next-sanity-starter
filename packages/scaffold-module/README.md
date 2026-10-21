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

Creates the module's schema, component and query from `templates/` and adds it to every list slot of the wiring manifest (`@repo/check-wiring/manifest`, the slots `pnpm check:wiring` reads) — together the six points of the wiring checklist in `AGENTS.md`. `--inline` also registers the three inline places; use it only for a module that belongs inside text. A new module always joins the page stack; to keep it inline only, delete its lines in `moduleTypes`, the `ModulesRenderer` switch and `modulesQuery` afterwards. The schema starts with a `heading` field, like `module.carousel` and `module.contentRefs`.

Every change is computed before anything is written. A missing anchor, an existing file or a slot that already lists the module aborts with nothing written. Touched files are formatted with Biome.

## After running

```bash
pnpm generate        # schema + TypeGen — the component's ModuleOf<…> gets its fields
pnpm check:wiring
pnpm typecheck
```

## Templates

`templates/*.tmpl` use `__MODULE_NAME__` (`module.hero`), `__MODULE_TITLE__` (`Hero`), `__MODULE_VAR__` (`moduleHero`), `__MODULE_QUERY_VAR__` (`moduleHeroQuery`) and `__MODULE_COMPONENT__` (`ModuleHero`).

## Tests

`test/scaffold.e2e.test.mjs` (run by `pnpm test:tooling`) scaffolds `Hero` and `Quote --inline` into a copy of the checkout and runs the schema extract and typegen, `check:typegen`, `check:wiring` and `tsc` for web and studio; a second test checks that a missing anchor writes nothing.
