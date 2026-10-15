# Claude Code — repo entrypoint

Project guardrails: @AGENTS.md (canonical for all AI coding tools).

Subtree `CLAUDE.md` files load with their folder (`web/`, `web/sanity/`, `web/src/components/modules/`, `studio/`, `studio/schemas/objects/modules/`) and add only local gotchas. On a conflict AGENTS.md wins — change it first, then the mirror.

- i18n: this is `variant/document-level` — document-level i18n (one document per language), so AGENTS.md §"Branch-specific notes" wins over its field-level §i18n. Select documents in GROQ with `language == $locale`; their fields are plain and render directly. **NEVER** add `internationalizedArray*` fields or `pickLocalizedString` calls for content.
- i18n: **NEVER** edit the plugin-managed `language` field on documents.
