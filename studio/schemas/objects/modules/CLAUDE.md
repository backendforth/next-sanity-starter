# studio/schemas/objects/modules/ — Claude Code subtree rules

Canonical: @../../../../AGENTS.md §"The module pattern". Deep doc: @../../README.md §8.

This folder holds the **schema half** of every module. You are touching point 1 of the 8-step wiring.

## YOU MUST

1. Run `pnpm gen:module <Name>` from the repo root instead of hand-writing — it creates all 8 files atomically. Hand-writing risks missing a wiring point.
2. If you do hand-write: touch all 8 points (see @../../../../AGENTS.md). Use `pnpm check:wiring` to verify.
3. Use `module.<id>` as the schema `name` (lowercase, dot-separated). It is the contract referenced by `richTextMedia.ts`, `modulesArrayField.ts`, GROQ projections, component `_type` switches, and TS unions.
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

- Defining a module schema without its matching `Module<Name>.tsx` component → renderer crashes on `_type`.
- Adding to `richTextMedia.ts` but forgetting `modulesArrayField.ts` (or vice versa) → editors see different insert options in body vs document-level modules array.
- Skipping `preview` — Studio shows "Untitled" for every instance.
- Renaming `name: "module.<id>"` after data exists — it's a destructive migration; avoid.
