import type { NavMenuLink } from "@/sanity/types/nav";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import type { LanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { resolveFooterMenuRows } from "../../utils/navHref";
import { NavItem } from "./NavItem";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	locale: string;
	footerMenu?: NavMenuLink[] | null;
	pathUtils: Pick<LanguagePathUtils, "localePath">;
	siteLocale?: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale"> | null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Footer({ locale, footerMenu, pathUtils, siteLocale }: Props) {
	const rows = resolveFooterMenuRows(footerMenu, locale, pathUtils, siteLocale);

	if (rows.length === 0) {
		return null;
	}

	return (
		<footer className="mt-auto border-t border-color-border-subtle bg-color-bg">
			<div className="mx-auto flex w-full max-w-container flex-col gap-sm px-md py-md sm:px-container">
				<nav
					className="flex flex-col gap-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-sm sm:gap-y-xs"
					aria-label="Footer"
				>
					{rows.map((row) => (
						<NavItem key={row.id} row={row} className="text-color-text-muted" />
					))}
				</nav>
			</div>
		</footer>
	);
}
