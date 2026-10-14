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

If the document uses `internationalizedArray*` field types, ensure those string names are listed under **`internationalizedArray`** in **`sanity.config.ts`** (`fieldTypes`). Language tabs come from **`siteLanguageSettings`** at runtime (`config/sync/internationalizedArrayLanguages.ts`); see **`utils/README.md`**.

## 6. Slugs

For any field that maps to a URL segment, reuse **`validateSlug`** from `utils/validateSlug.ts` on the slug field’s **`validation`**, as in `schemas/documents/page.ts`.

Give the slug a **Generate** button with `options.source: titleSlugSource` (`utils/titleSlugSource.ts`). Titles are `internationalizedArrayString`, so a plain `source: "title"` would not resolve to a string; the helper takes the first non-empty localized title.

## 7. Shared media objects (`media.*`)

Reusable **`type: "object"`** types for image and Mux video live under **`objects/media/`**:

- **`media.image`** — image (hotspot) and optional caption.
- **`media.video`** — **`mux.video`**, optional poster image, player settings (autoplay, controls), optional caption.

They are composed by **`module.media`** and can be embedded elsewhere without duplicating field definitions.

Fields that take an image upload (the `media.image` image, both video posters, `module.carousel` slides, the SEO / OG images and the favicon) show **`IMAGE_COLOR_PROFILE_HINT`** from `schemas/constants/media.ts` as their description. Reuse it on new image fields.

## 8. Content modules (`module.*`)

Modules are **`type: "object"`** schema types whose name follows **`module.<something>`** (e.g. `module.media`, `module.text`). They are used in two places:

1. **On documents** — as items in the **`modules`** array field, defined by **`fields/modulesArrayField.ts`** (`moduleTypes` + `modulesArrayField({ group })` on pages and singletons). Every module.
2. **Inside Portable Text** — as block types in **`objects/editors/richTextMedia.ts`** (alongside `block`), so editors can insert them in rich text bodies (`internationalizedArrayRichTextMedia`). **Opt-in**: only modules that belong inside text (today `module.media` and `module.carousel`).

### Adding a new module (checklist)

> **Prefer the scaffolder.** Run `pnpm gen:module <PascalName>` from the repo root (`--inline` for a rich-text module): it creates the studio + web files and wires every point, the `ModulesRenderer.tsx` `case` included, or writes nothing if an anchor is missing. See `packages/scaffold-module/README.md`. The steps below describe the Studio half of what it does.

1. **Define the object** — create `schemas/objects/modules/<name>.ts` with `defineType`:
   - **`name`:** `module.<id>` (stable string; used in GROQ and the `of` arrays).
   - **`type: "object"`** — fields, `preview`, optional `icon`, etc.
2. **Register the type** — export it and add it to **`schemas/index.ts`** → `schemaTypes` (keep module types together with other `module.*` entries).
3. **Document-level `modules` arrays** — append `{ type: "module.<id>" }` to **`moduleTypes`** in **`fields/modulesArrayField.ts`**.
4. **Inline (opt-in)** — append `{ type: "module.<id>" }` to the **`of`** array in **`objects/editors/richTextMedia.ts`**, and on the web side to `richTextMediaQuery` and the `types` map in `portableTextComponents.tsx`. All three or none.

After any module change, run `pnpm generate` and `pnpm check:wiring` from the repo root; the check covers the 7 wiring points (AGENTS.md) and the inline places.

You do **not** need a Desk structure item for a module (modules are not documents). The frontend should render each `_type` (e.g. `module.text`) in page templates and in any Portable Text serializer that handles custom block types.

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

`module.contentRefs` uses **`PAGE_REFERENCES`** and **`PROJECT_REFERENCES`** in **`schemas/constants/references.ts`** (`contentRefReferenceFilter`). Internal **`link`** marks still use **`PAGE_REFERENCES`** only. Routable types: **`page`**, **`project`** (slug), **`home`** and **`work`** (singletons). See section 4 for Presentation paths (`/work`, `/work/{slug}`).

Reference pickers list their suggestions newest first: spread **`NEWEST_FIRST_SUGGESTIONS`** (same file) into the field’s `options`, next to any `filter`. Do the same on new reference fields.

## 9. Mux / media

Video fields use types provided by **`sanity-plugin-mux-input`** (e.g. `mux.video`). The plugin is already registered in **`sanity.config.ts`**; your object schema only references the field `type`. **`module.media`** and **`media.video`** use **`mux.video`** for all video.

The encoding ceiling is set per field: `options: { max_resolution_tier }` on a `mux.video` field overrides the plugin default and is both the preset and the maximum in the upload dialog. **`media.video`** encodes up to **2160p**, **`media.videoLoop`** up to **1440p**. To raise loops to 4K, change only the `videoLoop.ts` value to `"2160p"`; existing assets keep their ladder until re-encoded. No progressive MP4 (`mp4_support: "none"`).

## 10. Initial value templates (optional)

If you need “New document” templates with presets, add them through `schema.templates` in `sanity.config.ts` (`(prev) => [...prev, …]`). Singletons are kept out of the global “Create” menu by `document.newDocumentOptions` (`isSingletonTemplate` in `config/singletons.ts`).

## Checklist summary

| Step | File / area |
|------|----------------|
| Define type | New file under `schemas/...` |
| Register schema | `schemas/index.ts` → `schemaTypes` |
| Sidebar | `config/structure/items/...` + `config/structure/index.ts` |
| Internal links | `schemas/constants/references.ts` |
| Preview routes | `config/presentation/conventions.ts`, `resolve.ts`, `locationsResolver.ts` |
| Languages | `config/sync/internationalizedArrayLanguages.ts`, `sanity.config.ts` (plugin) |
| Slug rules | `validation: validateSlug` on slug fields |
| New **module** | New file `objects/modules/module<Name>.ts`, `index.ts`, `richTextMedia.ts`, `fields/modulesArrayField.ts` (`moduleTypes`) |
| New **`media.*` object** | `objects/media/`, register in `index.ts` **before** types that embed it (e.g. `module.media`) |
