# studio/schemas/objects/modules/ — Claude Code subtree rules

Canonical: @../../../../AGENTS.md §"The module pattern" — this folder holds point 1. Deep doc: [schemas/README.md](../../README.md) §8. Prefer `pnpm gen:module <Name>`; add `--inline` only for a module that belongs inside rich text.

- i18n: module fields are plain (`string`, `richText`, `richTextMedia`); a `preview` selects them directly.
- File `module<Name>.ts`, `export const module<Name>` and `name: "module.<id>"` must match — `check:wiring` finds a module only by all three.
- Give every module a `preview`, or Studio lists each instance as "Untitled".
- Renaming `module.<id>` once content exists needs a data migration.
