import type { StructureResolver } from "sanity/structure";

import { errorSettingsStructureItem } from "./items/errorSettings";
import { globalSeoStructureItem } from "./items/globalSeo";
import { homeStructureItem } from "./items/home";
import { pagesStructureItem } from "./items/pages";
import { siteSettingsStructureItem } from "./items/siteSettings";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      homeStructureItem(S),
      pagesStructureItem(S),
      S.divider(),
      siteSettingsStructureItem(S),
      globalSeoStructureItem(S),
      errorSettingsStructureItem(S),
    ]);
