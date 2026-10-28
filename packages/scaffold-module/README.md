# @repo/scaffold-module

Scaffolds a new content module and wires it at every point of the module pattern in [`/AGENTS.md`](../../AGENTS.md), or clears the page stack so a project starts its own modules from an empty `modules[]`.

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

## Clearing the page stack

```bash
pnpm clear:modules --dry-run  # list the changes, write nothing
pnpm clear:modules            # delete them
```

A module that rich text embeds (the inline slots) stays, inline only: it leaves `moduleTypes`, the `ModulesRenderer` switch and `modulesQuery`. Every other module is deleted: its schema, component and query, its entries in every slot, and the files in `web/src/components/modules/` that only deleted files import. If a kept module embeds a deleted one, or a slot is missing, nothing is written. Then `pnpm generate`, `pnpm check:wiring` and `pnpm typecheck`; all pass on the empty stack. The next `pnpm gen:module <Name>` is the only entry.

Run it at the start of a project: content that already holds a deleted module shows it as an unknown type in the Studio.

## Templates

`templates/*.tmpl` use `__MODULE_NAME__` (`module.hero`), `__MODULE_TITLE__` (`Hero`), `__MODULE_VAR__` (`moduleHero`), `__MODULE_QUERY_VAR__` (`moduleHeroQuery`) and `__MODULE_COMPONENT__` (`ModuleHero`).

## Tests

`test/scaffold.e2e.test.mjs` (run by `pnpm test:tooling`) scaffolds `Hero` and `Quote --inline` into a copy of the checkout and runs the schema extract and typegen, `check:typegen`, `check:wiring` and `tsc` for web and studio. A second test runs `clear:modules`, the same checks on the empty stack, then `Hero` and the checks again; a third checks that a missing anchor writes nothing.
