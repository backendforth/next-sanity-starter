import type { AppLocale } from "@/src/i18n/config";
import type { NavMenuLink } from "@/sanity/types/nav";
import { localePath } from "@/src/i18n/paths";

import { NavbarClient } from "./NavbarClient";
import { resolveMainMenuRows } from "./navHref";

type Props = {
	locale: AppLocale;
	mainMenu?: NavMenuLink[] | null;
	siteTitle?: string | null;
};

export function Navbar({ locale, mainMenu, siteTitle }: Props) {
	const rows = resolveMainMenuRows(mainMenu, locale);
	const homeHref = localePath("/", locale);
	const trimmedTitle = typeof siteTitle === "string" ? siteTitle.trim() : "";
	const brandLabel =
		trimmedTitle.length > 0 && trimmedTitle !== "Navigation"
			? trimmedTitle
			: "Site";

	return (
		<NavbarClient rows={rows} homeHref={homeHref} brandLabel={brandLabel} />
	);
}
