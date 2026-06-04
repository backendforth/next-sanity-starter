# web/src/components/modules/ — Claude Code subtree rules

Canonical: @../../../../AGENTS.md §"The module pattern".

This folder holds the **component half** of every module. You are touching points 5–6 of the 8-step wiring.

## YOU MUST

1. Prefer `pnpm gen:module <Name>` over hand-writing — it scaffolds all 8 points atomically.
2. Name the file `Module<Name>.tsx` (PascalCase). The Sanity schema `name` must be `module.<name>` (dot-lowercase). 1:1 correspondence.
3. Accept `{ data, locale, siteLocale }` props — even if the module doesn't read i18n today. `ModulesRenderer` always passes them; consistency matters when fields become translatable.
4. Resolve i18n via `pickLocalizedString` / `parseLocalizedText` from `@/sanity/utils/sanityLocalizedText`. **NEVER** index arrays directly or call `.find(t => t.language === locale)`.
5. Set `data-sanity` attrs on the root element — Visual Editing click-to-edit depends on it. Copy the pattern from `ModuleText.tsx`.
6. Register in `ModulesRenderer.tsx` (`_type` switch) and the barrel `index.ts`. Heavy components use `next/dynamic` (see `ModuleCarousel` import in `ModulesRenderer.tsx` for the pattern).

## Component shape

```tsx
import type { ContentModuleFoo } from "@/sanity/types/modules/foo";
import type { SiteLocaleConfig } from "@/i18n/fallbackSiteLocales";
import { parseLocalizedText } from "@/sanity/utils/sanityLocalizedText";

type Props = {
  data: ContentModuleFoo;
  locale: string;
  siteLocale: SiteLocaleConfig;
};

export function ModuleFoo({ data, locale, siteLocale }: Props) {
  const body = parseLocalizedText({ value: data.body, locale, siteLocale, as: "blocks" });
  return (
    <section data-sanity={data._key}>
      {/* render */}
    </section>
  );
}
```

## Hand-maintained types

`web/sanity/types/modules/<name>.ts` is **NOT** generated. After changing the schema or the GROQ projection, update this type by hand. `pnpm check:wiring` catches missing files; field renames slip through silently.

## Anti-patterns specific to module components

- Component without a matching GROQ projection → query returns `null`/`undefined`.
- Component without a TS type → `any` propagates through the renderer.
- Reading locale via `useRouter()` / `usePathname()` → wrong locale during SSR.
- Skipping `data-sanity` → editor click-to-edit breaks on this module.
- Importing from `studio/...` — illegal across packages.
