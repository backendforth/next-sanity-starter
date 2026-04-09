import { ControlsIcon } from "@sanity/icons";
import type { StructureResolver } from "sanity/structure";

import { errorSettingsStructureItem } from "./items/errorSettings";
import { homeStructureItem } from "./items/home";
import { pagesStructureItem } from "./items/pages";
import { siteCookieBannerStructureItem } from "./items/siteCookieBanner";
import { siteNavStructureItem } from "./items/siteNav";
import { siteSettingsStructureItem } from "./items/siteSettings";

export const structure: StructureResolver = (S) =>
	S.list()
		.title("Content")
		.items([
			homeStructureItem(S),
			pagesStructureItem(S),
			S.divider(),
			S.listItem()
				.title("Settings")
				.icon(ControlsIcon)
				.child(
					S.list()
						.title("Settings")
						.items([
							siteSettingsStructureItem(S),
							siteNavStructureItem(S),
							errorSettingsStructureItem(S),
							siteCookieBannerStructureItem(S),
						]),
				),
		]);
