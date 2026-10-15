# Schemas

Schema types are defined with `defineType` from `sanity` and grouped in folders by role: **`documents/`**, **`singletons/`**, **`settings/`**, **`objects/`** (editors, modules, SEO, links), etc. Only types listed in **`index.ts`** are part of the Studio schema.

## 1. Create the type

- **Document** — `type: "document"`, unique `_id` per document (e.g. `schemas/documents/page.ts`).
- **Singleton** — still `type: "document"`. A global singleton fixes its id in structure (`documentId("siteLanguageSettings")`). A per-language singleton such as `home` (`schemas/singletons/home.ts`) has one document per language; list it with `S.documentTypeList` and add it to `config/singletons.ts` to lock delete / unpublish / duplicate.
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

After schema changes, regenerate and commit the typegen artifacts (Studio schema and types, and the web query types that follow from them):

```bash
pnpm generate
git add studio/schema.json studio/sanity.types.gen.ts web/sanity/sanity.types.gen.ts
```

CI fails if `pnpm generate` produces a diff. The web app has no hand-written Sanity types: `web/sanity/types.ts` derives them from the generated file.

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

This branch translates whole documents (`@sanity/document-internationalization`): one document per language, and content fields stay plain (`string`, `richText`, `richTextMedia`). To make a document type translatable:

1. Add `languageField` (`schemas/fields/languageField.ts`: hidden, read-only, `initialValue: "en"`) to `fields`. The plugin sets it; never edit it by hand.
2. Add the type name to **`TRANSLATABLE_SCHEMA_TYPES`** in **`sanity.config.ts`**.
3. Filter its web queries with `language == $locale` (see `web/sanity/queries/README.md`).

The language list comes from **`siteLanguageSettings`** at runtime (`config/sync/supportedLanguages.ts`); see **`utils/README.md`**.

## 6. Slugs

For any field that maps to a URL segment, reuse **`validateSlug`** from `utils/validateSlug.ts` on the slug field’s **`validation`**, as in `schemas/documents/page.ts`.

Give the slug a **Generate** button with `options.source: "title"`. On this branch each language variant is its own document with a plain-string `title`, so `source` points at it directly (`main` needs a helper for its localized titles).

## 7. Shared media objects (`media.*`)

Reusable **`type: "object"`** types for image and Mux video live under **`objects/media/`**:

- **`media.image`** — image (hotspot) and optional caption.
- **`media.video`** — **`mux.video`**, optional poster image, player settings (autoplay, controls), optional caption.

They are composed by **`module.media`** and can be embedded elsewhere without duplicating field definitions.

Fields that take an image upload (the `media.image` image, both video posters, `module.carousel` slides, the SEO / OG images and the favicon) show **`IMAGE_COLOR_PROFILE_HINT`** from `schemas/constants/media.ts` as their description. Reuse it on new image fields.

## 8. Content modules (`module.*`)

Modules are **`type: "object"`** schema types whose name follows **`module.<something>`** (e.g. `module.media`, `module.text`). They are used in two places:

1. **On documents** — as items in the **`modules`** array field, defined by **`fields/modulesArrayField.ts`** (`moduleTypes` + `modulesArrayField({ group })` on pages and singletons). Every module.
2. **Inside Portable Text** — as block types in **`objects/editors/richTextMedia.ts`** (alongside `block`), so editors can insert them in rich text bodies (`richTextMedia` fields). **Opt-in**: only modules that belong inside text (today `module.media` and `module.carousel`).

### Adding a new module

`pnpm gen:module <PascalName>` (`--inline` for a rich-text module) creates the files and wires every point, or writes nothing if an anchor is missing. By hand, follow the wiring checklist in [`AGENTS.md`](../../AGENTS.md) → "The module pattern". Two Studio details the checklist leaves out:

- The file `objects/modules/module<Name>.ts` exports `module<Name>` (`defineType`) with `name: "module.<id>"`. `pnpm check:wiring` finds a module only when file, export and name match.
- A module needs no Desk structure item: it is an object, not a document.

### Inline is a choice per module

**`moduleTypes`** lists every module; `richTextMedia` lists only the inline ones. A block-level module like `module.contentRefs` makes no sense inside a paragraph, which is why the two lists differ by design. What must not differ are the three inline places — a type in the editor's `of` without its query branch and component handler can be inserted but renders nothing.

### Module overview

| Module | Role |
|--------|------|
| `module.media` | Image, Mux video, or silent loop via nested **`imageContent`** (`media.image`) / **`videoContent`** (`media.video`) / **`videoLoopContent`** (`media.videoLoop`) depending on `type` (`image` / `video` / `loop`). |
| `module.carousel` | Optional heading; **`imagesOnly`** (default `true`) uses **`slides`** (images only); when `false`, use **`slidesMedia`** (array of `module.media`). Behavior fieldset: **`loop`**, **`showThumbnails`**, **`showNavDots`**, **`autoplay`** + **`autoplayDelayMs`**. |
| `module.contentRefs` | Optional heading; **`sourceScope`** (`all` / `pages` / `projects`); **`showProjectFilters`** (projects only); **`selection`** (`all` / `selected`). Projects support **`projectCategory`** filters + sort (A–Z / newest) on the web. |
| `module.text` | Title + rich text body. |

**Breaking change (JSON / GROQ):** Legacy `module.media` stored `image`, `video`, `videoSettings`, and `caption` at the root. Current data nests these under **`imageContent`** and **`videoContent`** (caption lives on the nested `media.image` / `media.video` objects). Update queries and front-end mapping accordingly, or migrate old documents.

### Internal page references

`module.contentRefs` uses **`PAGE_REFERENCES`** and **`PROJECT_REFERENCES`** in **`schemas/constants/references.ts`** (`contentRefReferenceFilter`). Internal **`link`** marks still use **`PAGE_REFERENCES`** only. Every picker (links, content refs, project categories) is wrapped in **`sameLanguageReferenceFilter`**, so it only offers documents in the edited document's `language`. Routable types: **`page`**, **`project`** (slug), **`home`** and **`work`** (per-language singletons). See section 4 for Presentation paths (`/work`, `/work/{slug}`, prefixed with `/{language}` for non-default languages).

Reference pickers list their suggestions newest first: spread **`NEWEST_FIRST_SUGGESTIONS`** (same file) into the field’s `options`, next to any `filter`. Do the same on new reference fields.

## 9. Mux / media

Video fields use types provided by **`sanity-plugin-mux-input`** (e.g. `mux.video`). The plugin is already registered in **`sanity.config.ts`**; your object schema only references the field `type`. **`module.media`** and **`media.video`** use **`mux.video`** for all video.

The encoding ceiling is set per field: `options: { max_resolution_tier }` on a `mux.video` field overrides the plugin default and is both the preset and the maximum in the upload dialog. **`media.video`** encodes up to **2160p**, **`media.videoLoop`** up to **1440p**. To raise loops to 4K, change only the `videoLoop.ts` value to `"2160p"`; existing assets keep their ladder until re-encoded. No progressive MP4 (`mp4_support: "none"`).

## 10. Initial value templates (optional)

If you need “New document” templates with presets, add them through `schema.templates` in `sanity.config.ts` (`(prev) => [...prev, …]`). Singletons are kept out of every create menu — the global “Create” menu and the “Create new” button of reference inputs — by `document.newDocumentOptions` (`isSingletonTemplate` in `config/singletons.ts`); only structure items, which open them by fixed id, keep their templates. The filter knows the default template ids (= schema type) only, so don't add templates for a singleton type.

## Checklist summary

| Step | File / area |
|------|----------------|
| Define type | New file under `schemas/...` |
| Register schema | `schemas/index.ts` → `schemaTypes` |
| Sidebar | `config/structure/items/...` + `config/structure/index.ts` |
| Internal links | `schemas/constants/references.ts` |
| Preview routes | `config/presentation/conventions.ts`, `resolve.ts`, `locationsResolver.ts` |
| Languages | `config/sync/supportedLanguages.ts`; translatable types: `language` field + `TRANSLATABLE_SCHEMA_TYPES` in `sanity.config.ts` |
| Slug rules | `validation: validateSlug` on slug fields |
| New **module** | `pnpm gen:module <Name>`; by hand, the wiring checklist in `AGENTS.md` |
| New **`media.*` object** | `objects/media/`, register in `index.ts` **before** types that embed it (e.g. `module.media`) |
