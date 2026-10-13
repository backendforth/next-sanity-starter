# Desk structure

The **Structure API** controls the left-hand navigation in Sanity Studio. The root resolver is **`index.ts`**: it returns a `StructureResolver` that builds a list titled “Content”, nests **Work** (singleton + projects) and **Settings** in their own groups.

## How items are wired

- **`index.ts`** imports small factories from `items/*` and passes the `StructureBuilder` (`S`) into each. Each factory returns a `ListItem` (or similar) configured with title, icon, id, and **child** (what opens when you click).
- **Singletons** (one document per type, fixed id) typically use:
  - `S.document().schemaType("home").documentId("home")`
  - Same pattern for settings docs with stable ids (`siteSettings`, `errorSettings`, …).
- **Collections** use something like:
  - `S.documentTypeList("page").title("Pages")` — shows all documents of that type.

Icons come from `@sanity/icons`. Keep `.id()` values stable if you deep-link or use structure plugins that key off them.

## Adding a new sidebar entry

1. Create **`items/<feature>.ts`** exporting a function `function myStructureItem(S: StructureBuilder) { … }`.
2. Import it in **`index.ts`** and append it to the `.items([...])` array (or nest it under Settings).
3. Ensure the **schema type name** in `schemaType("…")` matches a type registered in **`schemas/index.ts`**.

## Settings group

The “Settings” list is a nested `S.list()` with its own `items` array. Add new settings singletons there when they are site-wide configuration rather than primary content.

## Relationship to schemas

Structure only **references** schema type names; it does not import schema definitions. If you add a type to `schemaTypes` but never add a structure item, editors may still open the document via search or direct URL, but it will not appear in your curated sidebar until you add it.
