import { cache } from "react";
import { client } from "@/src/sanity/client";
import type { StackModule } from "@/src/sanity/types/modules";
import type { IntlStringEntry } from "@/src/sanity/localizedString";
import { homeQuery } from "@/src/sanity/queries";

export type HomeModule = StackModule;

export type HomeDocument = {
  _id: string;
  title?: IntlStringEntry[] | null;
  modules?: HomeModule[] | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
  } | null;
};

export const getHome = cache(async (): Promise<HomeDocument | null> => {
  return client.fetch<HomeDocument | null>(homeQuery);
});
