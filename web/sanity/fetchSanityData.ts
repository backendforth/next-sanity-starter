import { cache } from "react";

import { client } from "./client";
import { homeQuery, pageBySlugQuery, siteNavMenusQuery } from "./queries";
import type { ContentModule } from "./types/modules";
import type { SiteNavMenusDocument } from "./types/nav";
import type { IntlStringEntry } from "./utils";

export type PageSeo = {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
} | null;

export type HomeDocument = {
  _id: string;
  title?: IntlStringEntry[] | null;
  modules?: ContentModule[] | null;
  seo?: PageSeo;
};

export type PageDocument = {
  _id: string;
  title?: IntlStringEntry[] | null;
  slug?: { current?: string | null } | null;
  modules?: ContentModule[] | null;
  seo?: PageSeo;
};

/** Dedupes home fetches between `app/layout` metadata and `app/page`. */
export const fetchHomeDocument = cache(() =>
  client.fetch<HomeDocument | null>(homeQuery),
);

/** Dedupes page fetches between `generateMetadata` and the page component. */
export const fetchPageBySlug = cache((slug: string) =>
  client.fetch<PageDocument | null>(pageBySlugQuery, { slug }),
);

/** `siteNav` main/footer menus with resolved links; no embedded modules. */
export const fetchSiteNavMenus = cache(() =>
  client.fetch<SiteNavMenusDocument | null>(siteNavMenusQuery),
);
