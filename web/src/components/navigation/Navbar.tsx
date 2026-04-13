import { studioLanguages } from "@repo/languages";
import type { NavMenuLink } from "@/sanity/types/nav";
import type { AppLocale } from "@/src/i18n/config";
import { localePath } from "@/src/i18n/paths";

import { NavbarClient } from "./NavbarClient";
import { resolveMainMenuRows } from "./navHref";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	locale: AppLocale;
	mainMenu?: NavMenuLink[] | null;
	siteTitle?: string | null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Navbar({ locale, mainMenu, siteTitle }: Props) {
	const rows = resolveMainMenuRows(mainMenu, locale);
	const homeHref = localePath("/", locale);
	const trimmedTitle = typeof siteTitle === "string" ? siteTitle.trim() : "";
	const brandLabel =
		trimmedTitle.length > 0 && trimmedTitle !== "Navigation"
			? trimmedTitle
			: "Site";

	return (
		<NavbarClient
			rows={rows}
			homeHref={homeHref}
			brandLabel={brandLabel}
			locale={locale}
			languages={studioLanguages}
		/>
	);
}
