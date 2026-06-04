# studio/schemas/objects/modules/ — Claude Code subtree rules

> Canonical: [`/AGENTS.md`](../../../../AGENTS.md) §"The module pattern". Deep doc: [`/studio/schemas/README.md`](../../README.md) §8.

This folder holds the **schema half** of every module. Every file here has a paired React component at `web/src/components/modules/Module<Name>.tsx` and a paired GROQ projection at `web/sanity/queries/components/modules/<name>.ts`. Drift between the three is a bug.

## When you add a new file here

You are touching point 1 of the 8-step wiring. The other 7 are mandatory:

| Step | File |
|---|---|
| 1 (here) | `studio/schemas/objects/modules/module<Name>.ts` |
| 2 | `studio/schemas/index.ts` — import + add to `schemaTypes` |
| 3 | `studio/schemas/objects/editors/richTextMedia.ts` — append `{ type: "module.<id>" }` to `of` |
| 4 | `studio/schemas/fields/modulesArrayField.ts` — append `{ type: "module.<id>" }` to `moduleTypes` |
| 5 | `web/src/components/modules/Module<Name>.tsx` |
| 6 | `web/src/components/modules/index.ts` — export barrel |
| 7 | `web/sanity/queries/components/modules/<name>.ts` + barrel |
| 8 | `web/sanity/types/modules/<name>.ts` + barrel |

If you cannot touch all 8, do not commit — revert.

## Schema file shape

```ts
import { defineType } from "sanity";

export const moduleFoo = defineType({
  name: "module.foo",                     // dot-separated, lowercase, MUST match Module<Name>
  type: "object",
  title: "Foo",
  icon: SomeIcon,                          // optional, helps editors
  fields: [
    // composed where possible from existing media.* / editors.* / etc.
  ],
  preview: {
    select: { /* fields used for the editor preview */ },
    prepare: ({ /* ... */ }) => ({ title: "...", subtitle: "..." }),
  },
});
```

## Hard rules

1. **Name `module.<id>` is the contract.** It is referenced in `richTextMedia.ts`, `modulesArrayField.ts`, GROQ projections, web component `_type` switches, and TS unions. Renaming is a breaking migration — avoid.
2. **Reuse `media.*` objects** for image/video. Never redefine image hotspot fields inline.
3. **Translatable text fields use `internationalizedArrayRichTextMedia`** (or its plain-string sibling) — never raw `array` of `block`.
4. **`preview` is required** so editors can scan stacked modules.
5. **Run `pnpm studio:generate` and commit `studio/schema.json` + `studio/sanity.types.gen.ts`** in the same commit as the schema change.

## Anti-patterns

- Defining a module here without the matching web component → renderer crashes on `_type`.
- Adding the module to `richTextMedia.ts` but forgetting `modulesArrayField.ts` (or vice versa) → editors see different insert options in body vs document-level modules array.
- Skipping `preview` — Studio shows "Untitled" for every instance.
