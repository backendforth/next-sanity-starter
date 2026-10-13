# web/src/components/modules/ — Claude Code subtree rules

Canonical: @../../../../AGENTS.md §"The module pattern".

This folder holds the **component half** of every module. You are touching points 5–6 of the 8-step wiring.

## YOU MUST

1. Prefer `pnpm gen:module <Name>` over hand-writing — it scaffolds all 8 points atomically.
2. Name the file `Module<Name>.tsx` (PascalCase). The Sanity schema `name` must be `module.<name>` (dot-lowercase). 1:1 correspondence.
3. Accept `{ module, locale, siteLocale }` props — even if the module doesn't read i18n today. `ModulesRenderer` always passes them; consistency matters when fields become translatable.
4. Resolve i18n via `pickLocalizedString` / `pickLocalizedPortableTextBlocks` / `parseLocalizedText` from `@/sanity/utils/sanityLocalizedText`. **NEVER** index arrays directly or call `.find(t => t.language === locale)`.
5. Don't set `data-sanity` yourself. `ModulesRenderer` wraps every module in an element carrying its field-level `data-sanity` path (built with `dataAttr`) — Visual Editing click-to-edit depends on that wrapper, so always render through it.
6. Register in `ModulesRenderer.tsx` (`_type` switch) and the barrel `index.ts`. Heavy components use `next/dynamic` (see `ModuleCarousel` import in `ModulesRenderer.tsx` for the pattern).

## Component shape

Mirrors `ModuleText.tsx` and the `pnpm gen:module` template:

```tsx
import type { ModuleFooData } from "@/sanity/types/modules";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

type Props = {
  module: ModuleFooData;
  locale: string;
  siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

export function ModuleFoo({ module, locale, siteLocale }: Props) {
  const title = pickLocalizedString(module.title, locale, siteLocale);
  return (
    <section className={moduleSectionClassName}>
      {title ? <h2 className={moduleHeadingClassName}>{title}</h2> : null}
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
- Rendering a module outside `ModulesRenderer` → no `data-sanity` wrapper, editor click-to-edit breaks on it.
- Importing from `studio/...` — illegal across packages.
