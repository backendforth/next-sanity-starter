# web/src/components/modules/ — Claude Code subtree rules

Canonical: @../../../../AGENTS.md §"The module pattern".

This folder holds the **component half** of every module. You are touching points 5–6 of the 8-step wiring.

## YOU MUST

1. Prefer `pnpm gen:module <Name>` over hand-writing — it scaffolds all 8 points atomically. **NOTE for this branch:** the generator's barrel patch is skipped because no `index.ts` barrel exists in this folder; the rest of the wiring still applies.
2. Name the file `Module<Name>.tsx` (PascalCase). The Sanity schema `name` must be `module.<name>` (dot-lowercase). 1:1 correspondence.
3. Accept `{ module, locale, siteLocale }` props — even if the module doesn't read i18n today. `ModulesRenderer` always passes them; consistency matters when fields become translatable.
4. Resolve i18n via `pickLocalizedString` / `parseLocalizedText` from `@/sanity/utils/sanityLocalizedText`. **NEVER** index arrays directly or call `.find(t => t.language === locale)`.
5. Set `data-sanity` attrs on the root element — Visual Editing click-to-edit depends on it. Copy the pattern from `ModuleText.tsx`.
6. Register the new component directly in `ModulesRenderer.tsx` (`_type` switch). **NOTE for this branch:** there is **no** `index.ts` barrel here, `ModuleCarousel` lives in `web/src/components/carousel/` (dynamic-imported), and `ModuleContentRefs` currently has only a dev-only placeholder. Replace the placeholder if you ship a real ContentRefs renderer.

## Component shape

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
		<section className={moduleSectionClassName} data-sanity={module._key}>
			{title ? <h2 className={moduleHeadingClassName}>{title}</h2> : null}
		</section>
	);
}
```

## Hand-maintained types

`web/sanity/types/modules/<name>.ts` is **NOT** generated. After changing the schema or the GROQ projection, update this type by hand. `pnpm check:wiring` catches missing files; field renames slip through silently.

## Anti-patterns specific to module components on this branch

- Component without a matching GROQ projection → query returns `null`/`undefined`.
- Component without a TS type → `any` propagates through the renderer.
- Reading locale via `useRouter()` / `usePathname()` → wrong locale during SSR.
- Skipping `data-sanity` → editor click-to-edit breaks on this module.
- Importing from `studio/...` — illegal across packages.
- **Re-creating a `web/src/components/modules/index.ts` barrel** on this branch — `ModulesRenderer.tsx` does not consume one; you'd be introducing a dead file.
