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
    <article className="flex flex-col gap-4 border-b border-borderSubtle pb-10 last:border-b-0 last:pb-0">
      {title ? (
        <h2 className="text-xl font-semibold tracking-tight text-headingColor">{title}</h2>
      ) : null}
      <SanityPortableText value={blocks} />
    </article>
  );
}
