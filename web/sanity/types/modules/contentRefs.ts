import type { IntlStringEntry } from "@/sanity/utils";

export type ModuleContentRefTarget = {
  _id?: string;
  _type?: "home" | "page" | string;
  title?: IntlStringEntry[] | null;
  slug?: string | null;
} | null;

export type ModuleContentRefsData = {
  _type: "module.contentRefs";
  _key?: string;
  heading?: IntlStringEntry[] | null;
  allowMultiple?: boolean | null;
  reference?: ModuleContentRefTarget;
  references?: Array<ModuleContentRefTarget> | null;
};
