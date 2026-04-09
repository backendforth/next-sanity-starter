# `web/sanity` — data layer for Sanity + Next.js

This folder holds the **Sanity client**, **GROQ queries**, **TypeScript types** for fetched module shapes, and **utilities** (localization, images, labels). It is designed so pages and components can stay thin: fetch at the route, map types, render.

## Layout

| Path | Role |
|------|------|
| `client.ts` | `createClient` — use for `fetch` in Server Components, Route Handlers, Server Actions |
| `queries/` | GROQ: `snippets/`, `components/` (`text/`, `modules/`), `pages/`, plus `queries/index.ts` barrel |
| `types/modules/` | TS types for `module.*` payloads (and shared image types) |
| `utils/` | `parseLocalizedText` (`sanityLocalizedText`), `sanityImageBuilder`, `sanityModuleLabel` |

Import queries from **`@/sanity/queries`**. Import utilities from **`@/sanity/utils`** (barrel) or **`@/sanity/utils/sanityImageBuilder`** etc.

---

## Translations (`utils/sanityLocalizedText.ts`)

Sanity uses **`internationalizedArray*`** fields: arrays of `{ language | _key, value }`.

Use a single entry point:

**`parseLocalizedText({ entries, locale?, as? })`**

- **`entries`** — the array field from your fetched document (e.g. `doc.title`, `module.body`).
- **`locale`** — optional; defaults to `"en"`. Locale tags like `en-US` also try the base language (`en`).
- **`as`** — optional; default **`"auto"`**:
  - **`auto`** — returns a **string** or **Portable Text blocks**, depending on what that field stores; if the requested locale is missing, falls back to another language that has content.
  - **`string`** — returns `string | undefined` (rich-text fields resolve to `undefined`).
  - **`blocks`** — returns `PortableTextBlock[]` (plain-string fields resolve to `[]`).

Example:

```ts
import { parseLocalizedText } from "@/sanity/utils";

const title = parseLocalizedText({ entries: doc.title, locale: "de", as: "string" });
const body = parseLocalizedText({ entries: module.body, locale: "de", as: "blocks" });

// Or let the field shape decide (string vs blocks):
const either = parseLocalizedText({ entries: someField, locale: "de" });
```

---

## Image builder (`utils/sanityImageBuilder.ts`)

Builds optimized CDN URLs from fetched **`image`** fields (`SanityImageField` from `@/sanity/types/modules`) using `@sanity/image-url`, and exposes metadata helpers.

Common exports:

- **`buildFetchedImageUrl(image, { width, height, quality, fit, auto, dpr })`**
- **`urlForFetchedImage(image, width)`** — convenience default (format + quality)
- **`getImageOrientation`**, **`isPortraitImage`**, **`isLandscapeImage`**
- **`getImageAspectRatio`**, **`getImageLqip`**, **`getImageDimensions`**

Example:

```ts
import { buildFetchedImageUrl, getImageOrientation } from "@/sanity/utils";
import type { SanityImageField } from "@/sanity/types/modules";

function HeroImage({ image }: { image: SanityImageField | null }) {
  if (!image) return null;
  const url =
    buildFetchedImageUrl(image, { width: 1200, auto: "format", quality: 85 }) ?? "";
  const orientation = getImageOrientation(image);
  return <img src={url} alt="" data-orientation={orientation} />;
}
```

Env: uses `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET_PRODUCTION` with optional `NEXT_PUBLIC_*` fallbacks — keep them aligned with `client.ts`.

---

## Module labels (`utils/sanityModuleLabel.ts`)

**`getSanityModuleLabel(moduleType)`** maps `_type` strings like `module.text` to short UI labels (e.g. for placeholders or dev overlays). Safe to use in fallbacks when a module has no React renderer yet.

---

## Queries

- **Overview** — GROQ basics, folder layout, Sanity Vision examples (home, pages, nav, settings). See `queries/README.md`.
- **Snippets** — reusable GROQ string pieces (`linkQuery`, `seoQuery`, `settingsBundleQuery`, …). See `queries/snippets/README.md`.
- **Components** — `modulesQuery`, `richTextMediaQuery`, per-module projections. See `queries/components/README.md`.
- **Pages** — `homeQuery`, `pageBySlugQuery`. See `queries/pages/README.md`.
- **Sitemap / slugs** — `pageSlugsQuery`, `sitemapPagesQuery` in `queries/snippets/sitemap.ts`.

Central export: `import { ... } from "@/sanity/queries"`.

---

## Example: page-level fetch with title + modules (Next.js App Router)

This example assumes your page document has i18n `title` and a `modules` array matching `modulesQuery`. Adjust types to your app.

```tsx
// app/[slug]/page.tsx
import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import { pageBySlugQuery } from "@/sanity/queries";
import { parseLocalizedText, type IntlStringEntry } from "@/sanity/utils";
import type { ContentModule } from "@/sanity/types/modules";

type PageDocument = {
  _id: string;
  title?: IntlStringEntry[] | null;
  modules?: ContentModule[] | null;
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await client.fetch<PageDocument | null>(pageBySlugQuery, { slug });

  if (!doc) {
    notFound();
  }

  const heading = parseLocalizedText({ entries: doc.title, as: "string" }) ?? slug;
  const modules = doc.modules ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">{heading}</h1>
      <ul className="mt-8 space-y-6">
        {modules.map((mod, i) => (
          <li key={mod._key ?? i}>
            <pre className="rounded border p-4 text-xs">{mod._type}</pre>
            {/* Replace with real module components (ModuleText, ModuleMedia, …) */}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

For production, swap the `<pre>` block for your real module renderer that switches on `mod._type` and narrows with `ContentModule` / specific `ModuleTextData` types.

---

## Environment

`client.ts` expects `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET_PRODUCTION` (see file). Image builder may also read `NEXT_PUBLIC_*` variants — document your deployment env in the main app README.
