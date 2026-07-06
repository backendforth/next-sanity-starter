import { ControlsIcon } from "@sanity/icons/Controls";
import type { StructureResolver } from "sanity/structure";

import { errorSettingsStructureItem } from "./items/errorSettings";
import { homeStructureItem } from "./items/home";
import { pagesStructureItem } from "./items/pages";
import { siteCookieBannerStructureItem } from "./items/siteCookieBanner";
import { siteLanguageSettingsStructureItem } from "./items/siteLanguageSettings";
import { siteNavStructureItem } from "./items/siteNav";
import { siteSettingsStructureItem } from "./items/siteSettings";
import { workGroupStructureItem } from "./items/workGroup";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      homeStructureItem(S),
      workGroupStructureItem(S),
      pagesStructureItem(S),
      S.divider(),
      S.listItem()
        .title("Settings")
        .icon(ControlsIcon)
        .child(
          S.list()
            .title("Settings")
            .items([
              siteLanguageSettingsStructureItem(S),
              siteSettingsStructureItem(S),
              siteNavStructureItem(S),
              errorSettingsStructureItem(S),
              siteCookieBannerStructureItem(S),
            ]),
        ),
    ]);
