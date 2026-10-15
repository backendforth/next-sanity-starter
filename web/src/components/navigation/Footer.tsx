import { containerClassName } from "@/src/components/layout/containerStyles";
import { uiLabel } from "@/src/i18n/uiLabels";
import type { ResolvedNavRow } from "../../utils/navHref";
import { NavItem } from "./NavItem";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	locale: string;
	/** `siteNav.footerMenu`, resolved by the layout (`resolveFooterMenuRows`). */
	rows: ResolvedNavRow[];
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Footer({ locale, rows }: Props) {
	if (rows.length === 0) {
		return null;
	}

	return (
		<footer className="mt-auto border-t border-color-border-subtle">
			<div className={`${containerClassName} flex flex-col gap-sm py-md`}>
				<nav
					className="flex flex-col gap-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-sm sm:gap-y-xs"
					aria-label={uiLabel("footer", locale)}
				>
					{rows.map((row) => (
						<NavItem key={row.id} row={row} tone="muted" />
					))}
				</nav>
			</div>
		</footer>
	);
}
