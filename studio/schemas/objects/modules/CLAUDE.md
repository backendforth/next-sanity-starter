# studio/schemas/objects/modules/ — Claude Code subtree rules

Canonical: @../../../../AGENTS.md §"The module pattern". Deep doc: @../../README.md §8.

This folder holds the **schema half** of every module. You are touching point 1 of the 6-point wiring.

## YOU MUST

1. Run `pnpm gen:module <Name>` from the repo root instead of hand-writing — it creates the module's files and wires every point, `ModulesRenderer.tsx` included. Add `--inline` only for a module that belongs inside rich text.
2. If you do hand-write: touch all 6 points (see @../../../../AGENTS.md). Use `pnpm check:wiring` to verify.
3. Use `module.<id>` as the schema `name` (lowercase, dot-separated). It is the contract referenced by `modulesArrayField.ts`, GROQ projections, component `_type` switches and the generated types. After a field change run `pnpm generate`.
4. Always provide a `preview` (`select` + `prepare`). Without it, Studio shows "Untitled" for every instance.

## Schema file shape

```ts
import { defineType } from "sanity";

export const moduleFoo = defineType({
  name: "module.foo",                     // dot-separated, MUST match Module<Name>.tsx
  type: "object",
  title: "Foo",
  icon: SomeIcon,
  fields: [
    // Compose from existing media.* / editors.* — do not redeclare image/video shapes.
  ],
  preview: {
    select: { /* ... */ },
    prepare: ({ /* ... */ }) => ({ title: "...", subtitle: "..." }),
  },
});
```

## Anti-patterns specific to module schemas

- Defining a module schema without its matching `Module<Name>.tsx` component (or its `ModulesRenderer.tsx` branch) → the module renders as `UnknownModule`: a dashed placeholder in dev, nothing in production. `pnpm check:wiring` fails on it.
- Adding a module to `richTextMedia.ts` without `richTextMediaQuery` and the `types` map in `portableTextComponents.tsx` → the editor can insert it inline, the page renders nothing. Inline is all three places or none; `pnpm check:wiring` fails otherwise.
- Skipping `preview` — Studio shows "Untitled" for every instance.
- Renaming `name: "module.<id>"` after data exists — it's a destructive migration; avoid.
