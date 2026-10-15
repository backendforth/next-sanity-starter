# web/src/components/modules/ — Claude Code subtree rules

Canonical: @../../../../AGENTS.md §"The module pattern" — this folder holds points 4–5 (the component and its `ModulesRenderer` case). `pnpm gen:module <Name>` writes both; its template `packages/scaffold-module/templates/component.tsx.tmpl` is the component shape.

- i18n: resolve every translatable field with `pickLocalizedString` / `pickLocalizedPortableTextBlocks` / `pickLocalizedValue`, using the `locale` and `siteLocale` props.
- Modules are server components. An interactive part goes behind a lazy client boundary like `web/src/components/media/LazyVideo.tsx` or `…/carousel/LazyCarouselViewport.tsx` (`next/dynamic` in a `"use client"` file, SSR on). `"use client"` on a module, or a static import of the player or carousel, puts it in every route's first-load JS.
- Section and heading classes shared by all modules live in `moduleStyles.ts`.
