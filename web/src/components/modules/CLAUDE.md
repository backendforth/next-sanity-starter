# web/src/components/modules/ — Claude Code subtree rules

Canonical: @../../../../AGENTS.md §"The module pattern".

This folder holds the **component half** of every module. You are touching points 4–5 of the 6-point wiring.

## YOU MUST

1. Prefer `pnpm gen:module <Name>` over hand-writing — it creates the module's files and wires every point, the `ModulesRenderer.tsx` `case` included. `pnpm check:wiring` compares the lists exactly.
2. Name the file `Module<Name>.tsx` (PascalCase). The Sanity schema `name` must be `module.<name>` (dot-lowercase). 1:1 correspondence.
3. Accept `{ module, locale, siteLocale }` props — even if the module doesn't read i18n today. `ModulesRenderer` always passes them; consistency matters when fields become translatable.
4. Resolve i18n via `pickLocalizedString` / `pickLocalizedPortableTextBlocks` / `pickLocalizedValue` from `@/sanity/utils/sanityLocalizedText`. **NEVER** index arrays directly or call `.find(t => t.language === locale)`.
5. Don't set `data-sanity` yourself. `ModulesRenderer` wraps every module in an element carrying its field-level `data-sanity` path (built with `dataAttr`) — Visual Editing click-to-edit depends on that wrapper, so always render through it.
6. Register in `ModulesRenderer.tsx` (a `case` in the `_type` switch — its `never` fallback turns a missing one into a `tsc` error).
7. Type `module` as `ModuleOf<"module.<id>">` from `@/sanity/types`. Compare fetched strings to literals through `stegaClean` / `isStegaVariant` — in Presentation they carry stega markers.

## Component shape

Mirrors `ModuleText.tsx` and the `pnpm gen:module` template:

```tsx
import type { ModuleOf } from "@/sanity/types";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

type Props = {
	module: ModuleOf<"module.foo">;
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

## Types come from TypeGen

`ModuleOf<"module.foo">` is derived from the generated query types. After changing the schema or the GROQ projection, run `pnpm generate`; `tsc` then flags every use that no longer fits. Never write the module's type by hand.

## Anti-patterns specific to module components

- Component without a matching GROQ projection → query returns `null`/`undefined`.
- `module.kind === "video"` on fetched data → always `false` in Presentation (stega); use `isStegaVariant(module, "kind", "video")`.
- Reading locale via `useRouter()` / `usePathname()` → wrong locale during SSR.
- Rendering a module outside `ModulesRenderer` → no `data-sanity` wrapper, editor click-to-edit breaks on it.
- `"use client"` on a module, or a static import of a heavy client component (player, carousel) → it lands in every route's first-load JS. Modules are server components; put the interactive part behind a lazy client boundary like `media/LazyVideo.tsx` or `carousel/LazyCarouselViewport.tsx` (`next/dynamic` in a `"use client"` file, SSR on).
- Importing from `studio/...` — illegal across packages.
