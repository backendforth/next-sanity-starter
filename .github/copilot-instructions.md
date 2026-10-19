# GitHub Copilot — repository instructions

`AGENTS.md` at the repo root holds this repo's guardrails: the module pattern, generated Sanity types, i18n, commands and the definition of done. Read it before suggesting a change; the per-folder `README.md` files are the deep docs it links to.

Two long-lived branches differ in one thing, where a locale lives: in the field on `main`, in the document on `variant/document-level`. Check the branch (`git rev-parse --abbrev-ref HEAD`) and read AGENTS.md → "Branch-specific notes" before touching locale code. Fixes land on `main` first and reach the variant by `git cherry-pick -x`; every PR names its `Variant-Port`. A project copied from the starter has `main` (production) and `development` (staging) instead and no `Variant-Port`; its AGENTS.md → "This repository" says so.

Copilot code review reads only this file, so the rules a review most often needs are repeated here (AGENTS.md has the reasons):

- Never edit generated files (`*.gen.*`, `studio/schema.json`); `pnpm generate` writes them and CI fails on a diff.
- Full queries go through `defineQuery`; no function calls inside a query, no `as` on Sanity data.
- Compare a fetched string to a literal only through `stegaClean` / `isStegaVariant`; never clean a whole rendered document.
- A module is wired in six places (`pnpm check:wiring` checks them); schema and component land in one commit.
- Locale handling differs by branch — judge it against AGENTS.md "Branch-specific notes", not against the other branch.
