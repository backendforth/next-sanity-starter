# Claude Code — repo entrypoint

Project guardrails: @AGENTS.md (canonical for all AI coding tools).

Claude Code additionally auto-loads scoped rules from subtree `CLAUDE.md` files based on the current working directory. Each one focuses on subtree-specific gotchas; the canonical rules stay in `AGENTS.md`:

- `web/CLAUDE.md` — Next.js app rules
- `studio/CLAUDE.md` — Sanity Studio rules
- `studio/schemas/objects/modules/CLAUDE.md` — schema half of the module pattern
- `web/src/components/modules/CLAUDE.md` — component half of the module pattern
- `web/sanity/CLAUDE.md` — query/type layer rules

**IMPORTANT:** When subtree rules conflict with `AGENTS.md`, `AGENTS.md` wins. Update `AGENTS.md` first, then propagate.

## Quick reminders (the full versions live in AGENTS.md)

- **YOU MUST** wire all 6 module points when adding/renaming a module (`pnpm gen:module <Name>` does it). Skipping any is a bug.
- **YOU MUST** run `pnpm generate` after schema or query edits, then `pnpm check:wiring`, then `pnpm typecheck`.
- **NEVER** edit `studio/sanity.types.gen.ts`, `studio/schema.json`, or any `*.gen.*` file.
- **NEVER** filter locale inside GROQ. Locale resolves at render time via `pickLocalizedString` / `pickLocalizedPortableTextBlocks`.
- Fixes land on `main` first and reach `variant/document-level` by `git cherry-pick -x`; every PR names its `Variant-Port` (AGENTS.md → "Porting fixes between branches").
