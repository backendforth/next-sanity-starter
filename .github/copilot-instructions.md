# GitHub Copilot — repository instructions

`AGENTS.md` at the repo root holds this repo's guardrails: the module pattern, generated Sanity types, i18n, commands and the definition of done. Read it before suggesting a change; the per-folder `README.md` files are the deep docs it links to.

Two long-lived branches differ in one thing, where a locale lives: in the field on `main`, in the document on `variant/document-level`. Check the branch (`git rev-parse --abbrev-ref HEAD`) and read AGENTS.md → "Branch-specific notes" before touching locale code. Fixes land on `main` first and reach the variant by `git cherry-pick -x`; every PR names its `Variant-Port`.
