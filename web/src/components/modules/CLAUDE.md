# web/src/components/modules/ — Claude Code subtree rules

> Canonical: [`/AGENTS.md`](../../../../AGENTS.md) §"The module pattern".

This folder holds the **component half** of every module. Every file here has a paired Sanity schema at `studio/schemas/objects/modules/module<Name>.ts`, a GROQ projection at `web/sanity/queries/components/modules/<name>.ts`, and a TS shape at `web/sanity/types/modules/<name>.ts`. All four must stay in sync.

## When you add a new component here

You are touching points 5–6 of the 8-step wiring. The other 6 are mandatory; see `/AGENTS.md` or `/studio/schemas/objects/modules/CLAUDE.md`.

## Component shape

```tsx
// ModuleFoo.tsx
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

## Hard rules

1. **Filename `Module<Name>.tsx` ↔ schema `module.<name>`.** PascalCase here, dot-lowercase there. Diverging names is a bug.
2. **Always accept `{ locale, siteLocale }`** even if you don't read i18n today — `ModulesRenderer` passes them and consistency matters when fields become translatable later.
3. **Resolve i18n via `pickLocalizedString` / `parseLocalizedText`.** Never index `value[0]` or `.find(t => t.language === locale)`.
4. **Never read locale from `useRouter()`** or browser APIs inside a module. SSR + Visual Editing both break.
5. **Set `data-sanity` attributes** on the root element so click-to-edit works. Copy the pattern from `ModuleText.tsx`.
6. **Register in `ModulesRenderer.tsx`** (`_type` switch). On this branch, the renderer imports module components directly — there is **no** `web/src/components/modules/index.ts` barrel and `ModuleCarousel` lives in `web/src/components/carousel/` (dynamic-imported). `ModuleContentRefs` currently has only a dev-only placeholder in `ModulesRenderer.tsx` — replace it before shipping a real renderer.
7. **Co-locate styles** under `web/src/assets/styles/` (Tailwind tokens) — no per-component CSS files.

## Hand-maintained types

`web/sanity/types/modules/<name>.ts` is **not** generated. After changing the schema or the GROQ projection, update this type by hand to match. CI typecheck will catch most drift, but field renames slip through if you forget.

## Anti-patterns

- Component without GROQ projection → query returns `null`/`undefined` for the field.
- Component without TS type → `any` propagates through the renderer.
- Reading locale via `useRouter()` / `usePathname()` → wrong locale during SSR.
- Skipping `data-sanity` → editor click-to-edit breaks on this module.
- Importing from `studio/` — illegal across packages.
- Re-creating a `web/src/components/modules/index.ts` barrel on this branch — `ModulesRenderer.tsx` does not consume one; you'd be introducing a dead file.
