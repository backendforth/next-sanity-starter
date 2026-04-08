import { cache } from "react";
import { client } from "@/sanity/client";
import type { StackModule } from "@/sanity/types/modules";
import type { IntlStringEntry } from "@/sanity/localizedString";
import { homeQuery } from "@/sanity/queries";

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
