# Claude Code — repo entrypoint

The canonical guardrails live in [`AGENTS.md`](AGENTS.md). Read it first.

Claude Code additionally auto-loads scoped rules from subtree `CLAUDE.md` files based on the current working directory:

- `web/CLAUDE.md` — Next.js app rules
- `studio/CLAUDE.md` — Sanity Studio rules
- `studio/schemas/objects/modules/CLAUDE.md` — schema half of the module pattern
- `web/src/components/modules/CLAUDE.md` — component half of the module pattern
- `web/sanity/CLAUDE.md` — query/type layer rules

When subtree rules conflict with `AGENTS.md`, `AGENTS.md` wins. Update `AGENTS.md` first, then propagate.
