# Schemas

Schema types are defined with `defineType` from `sanity` and grouped in folders by role: **`documents/`**, **`singletons/`**, **`settings/`**, **`objects/`** (editors, modules, SEO, links), etc. Only types listed in **`index.ts`** are part of the Studio schema.

## 1. Create the type

- **Document** — `type: "document"`, unique `_id` per document (e.g. `schemas/documents/page.ts`).
- **Singleton** — still `type: "document"`, but you fix the id in structure (e.g. `documentId("home")`) so only one instance exists (`schemas/singletons/home.ts`).
- **Object** — `type: "object"` for nested blocks, modules, SEO objects, links (`schemas/objects/...`).
- **Root-level types** that are not documents (e.g. shared defs) follow the same `defineType` pattern.

Use a stable **`name`** (the type string) — it is referenced everywhere below.

## 2. Register in `schemas/index.ts`

Export your type from its file and add it to the **`schemaTypes`** array:

```ts
import { myPage } from "./documents/myPage";

export const schemaTypes = [
  // …existing types
  myPage,
];
```

Order can matter for UI in rare cases; keep related types together. Anything omitted here is **invisible** to Studio and APIs.

## 3. Desk structure (not automatic)

The sidebar does **not** read `schemaTypes`. Add an entry under **`config/structure/`**:

- New file `config/structure/items/myPage.ts` that exports e.g. `myPageStructureItem(S)` using `S.documentTypeList("myPage")` or `S.document().schemaType("myPage").documentId("…")` for a singleton.
- Import that item in **`config/structure/index.ts`** and add it to the `.items([...])` array (or under Settings).

See **`config/structure/README.md`** for patterns.

## 4. Presentation / Web Preview (when relevant)

If the type is **routable** in the Next.js app:

- Add the type name to **`PAGE_REFERENCES`** in `schemas/constants/references.ts` if it should appear in internal links.
- Extend **`SLUG_BASED_DOCUMENT_TYPES`** in `config/presentation/conventions.ts` if the URL is `/:slug` from `slug.current`.
- Update **`config/presentation/resolve.ts`** (`presentationMainDocuments`) if you need a route other than `/` or `/:slug`.
- Adjust **`config/presentation/locationsResolver.ts`** (or `staticLocationsForType`) for custom paths or error pages.

Singletons that should open Web Preview at `/` belong in **`SITE_ROOT_DOCUMENT_TYPES`** (`conventions.ts`). Types that must **not** show Web Preview (e.g. global settings) go in **`DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`**.

## 5. Multi-language fields

If the document uses `internationalizedArray*` field types, ensure those string names are listed under **`internationalizedArray`** in **`sanity.config.ts`** (`fieldTypes`). Language lists live in **`schemas/constants/languages.ts`**; see **`utils/README.md`**.

## 6. Slugs

For any field that maps to a URL segment, reuse **`validateSlug`** from `utils/validateSlug.ts` on the slug field’s **`validation`**, as in `schemas/documents/page.ts`.

## 7. Mux / media

Video fields use types provided by **`sanity-plugin-mux-input`** (e.g. `mux.video`). The plugin is already registered in **`sanity.config.ts`**; your object schema only references the field `type`. See **`schemas/objects/modules/media.ts`**.

## 8. Initial value templates (optional)

If you need “New document” templates with presets, register them in **`config/initialValueTemplates.ts`** and wire through `sanity.config.ts` (`initialValueTemplates`). The default in this repo is an empty array.

## Checklist summary

| Step | File / area |
|------|----------------|
| Define type | New file under `schemas/...` |
| Register schema | `schemas/index.ts` → `schemaTypes` |
| Sidebar | `config/structure/items/...` + `config/structure/index.ts` |
| Internal links | `schemas/constants/references.ts` |
| Preview routes | `config/presentation/conventions.ts`, `resolve.ts`, `locationsResolver.ts` |
| Languages | `schemas/constants/languages.ts`, `sanity.config.ts` (plugin) |
| Slug rules | `validation: validateSlug` on slug fields |
