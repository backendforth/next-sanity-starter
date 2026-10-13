# web/src/components/modules/ — Claude Code subtree rules

Canonical: @../../../../AGENTS.md §"The module pattern". On this branch (`variant/document-level`), AGENTS.md §"Branch-specific notes" wins over the field-level §i18n.

This folder holds the **component half** of every module. You are touching points 5–6 of the 8-step wiring.

## YOU MUST

1. Prefer `pnpm gen:module <Name>` over hand-writing — it creates the schema, component, query, and type files and patches the barrels (including `index.ts` here). It does **not** edit `ModulesRenderer.tsx`; it prints the branch to paste.
2. Name the file `Module<Name>.tsx` (PascalCase). The Sanity schema `name` must be `module.<name>` (dot-lowercase). 1:1 correspondence.
3. Accept `{ module }`. Fields are plain values in the document's language — render them directly, no `pickLocalizedString`. Add `locale` / `siteLocale` props only when the module builds hrefs (as `ModuleContentRefs` does), and pass them from `renderModuleChild` in `ModulesRenderer.tsx`.
4. Don't set `data-sanity` yourself. `ModulesRenderer` puts one `data-sanity` attribute on the module container (path `modules`, built with `dataAttr`) — Visual Editing click-to-edit depends on it, so always render through `ModulesRenderer`.
5. Register in `ModulesRenderer.tsx` (`_type` switch in `renderModuleChild`) and the barrel `index.ts`. Heavy components use `next/dynamic` (see the `ModuleCarousel` import in `ModulesRenderer.tsx` for the pattern).

## Component shape

Mirrors `ModuleText.tsx` and the `pnpm gen:module` template:

```tsx
import type { ModuleFooData } from "@/sanity/types/modules";

import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

type Props = {
	module: ModuleFooData;
};

export function ModuleFoo({ module }: Props) {
	const title = typeof module.title === "string" ? module.title.trim() : "";
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
- Calling `pickLocalizedString` / `parseLocalizedText` on module fields — they are plain values on this branch.
- Reading locale via `useRouter()` / `usePathname()` → wrong locale during SSR.
- Rendering a module outside `ModulesRenderer` → no `data-sanity` container, editor click-to-edit breaks on it.
- Importing from `studio/...` — illegal across packages.
