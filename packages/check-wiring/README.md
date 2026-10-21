# @repo/check-wiring

Two CI gates and the wiring manifest they and `gen:module` share.

## `pnpm check:wiring`

Compares the module wiring documented in [`/AGENTS.md`](../../AGENTS.md) ("The module pattern") with the module schemas under `studio/schemas/objects/modules/`, as sets, both ways:

| Point | Checked |
|---|---|
| Schema file | `module<Name>.ts` with `name: "module.<id>"` and `export const module<Name>`, all three matching. |
| Component + query files | `web/src/components/modules/Module<Name>.tsx`; `web/sanity/queries/components/modules/<name>.ts` exporting `module<Name>Query`. |
| Schema index | `schemas/index.ts` (import + `schemaTypes`) lists every module. |
| Page stack | `moduleTypes`, a `case` in `ModulesRenderer`'s switch and `modulesQuery` name the same modules: a module in a document's `modules[]` is in all three, any other in none. |
| Inline (opt-in) | The Studio's `richTextMedia` `of`, `richTextMediaQuery` and the `types` map in `portableTextComponents.tsx` name the same modules. |
| Used | A module outside both groups is a field or array member type of another module's schema (`type: "module.<id>"`, a carousel's slides), else it is unused and fails. |

In every slot, an entry for a module without a schema is stale and fails.

The module's TS type is not checked here: it is `ModuleOf<"module.<id>">`, and `tsc` covers it. `--root <dir>` checks another checkout.

## `pnpm check:typegen`

Part of `pnpm generate`. Sanity TypeGen skips a `defineQuery` it cannot evaluate statically (a function call, a non-`const` fragment) with nothing but a spinner warning; the query then types as `unknown`. This checks that every `defineQuery` in `web/sanity/` has a `// Variable:` block in `web/sanity/sanity.types.gen.ts`.

## The manifest (`@repo/check-wiring/manifest`)

`src/manifest.mjs` describes each list slot once: the file, a header pattern that opens the list, and bracket matching to find its end — no marker comments. Each slot can `read` the module ids it holds and `insert` one more. `check:wiring` reads through it; `gen:module` writes through it, so the two cannot disagree about where a module goes.

## Tests

`pnpm test:tooling` runs `test/*.test.mjs` here and in `@repo/scaffold-module`: the manifest against the repo's files, each failure mode of `check:wiring` on a modified copy, and an end-to-end scaffold. CI runs it in the `format • typecheck` job.
