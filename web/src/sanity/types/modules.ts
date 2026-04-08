import type { IntlRichTextEntry } from "@/src/sanity/localizedPortableText";
import type { IntlStringEntry } from "@/src/sanity/localizedString";

export type ModuleTextData = {
  _type: "module.text";
  _key?: string;
  title?: IntlStringEntry[] | null;
  body?: IntlRichTextEntry[] | null;
};

export type StackModule = {
  _type?: string;
  _key?: string;
} & Partial<ModuleTextData>;
