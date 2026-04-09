import type { AppLocale } from "@/src/i18n/config";
import type { NavMenuLink } from "@/sanity/types/nav";

import { NavRowControl } from "./NavRowControl";
import { resolveFooterMenuRows } from "./navHref";

type Props = {
	locale: AppLocale;
	footerMenu?: NavMenuLink[] | null;
};

const footerLinkClassName = "text-sm text-textMuted hover:text-linkColor py-1";

export function Footer({ locale, footerMenu }: Props) {
	const rows = resolveFooterMenuRows(footerMenu, locale);

	if (rows.length === 0) {
		return null;
	}

	return (
		<footer className="mt-auto border-t border-borderSubtle bg-bgColor">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8 sm:px-8">
				<nav
					className="flex flex-col gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:gap-x-4 xs:gap-y-2"
					aria-label="Footer"
				>
					{rows.map((row) => (
						<NavRowControl
							key={row.id}
							row={row}
							className={footerLinkClassName}
						/>
					))}
				</nav>
			</div>
		</footer>
	);
}
