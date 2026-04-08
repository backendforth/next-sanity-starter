import { pickLocalizedPortableTextBlocks } from "@/sanity/localizedPortableText";
import { pickLocalizedString } from "@/sanity/localizedString";
import type { ModuleTextData } from "@/sanity/types/modules";
import { SanityPortableText } from "./SanityPortableText";

type ModuleTextProps = {
  module: ModuleTextData;
  locale?: string;
};

export function ModuleText({ module, locale = "en" }: ModuleTextProps) {
  const title = pickLocalizedString(module.title, locale);
  const blocks = pickLocalizedPortableTextBlocks(module.body, locale);

  return (
    <article className="flex flex-col gap-4 border-b border-zinc-200 pb-10 last:border-b-0 last:pb-0 dark:border-zinc-800">
      {title ? (
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
      ) : null}
      <SanityPortableText value={blocks} />
    </article>
  );
}
