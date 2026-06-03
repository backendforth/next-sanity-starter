import { cn } from "@/src/utils/cn";

/** Language / theme toggle groups — tight gap between options in one control. */
export const navControlGroupClass =
	"inline-flex shrink-0 flex-wrap items-center gap-min";

/** Main menu links + site title — text only; active = underline. */
export function navLinkButtonClass(
	active: boolean,
	className?: string,
): string {
	return cn(
		"nav-menu shrink-0 font-normal transition-colors",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent",
		active ? "text-color-heading" : "text-color-text hover:text-color-link",
		className,
	);
}

/** @deprecated Use {@link navControlGroupClass} — same pill control spacing. */
export const contentRefsFilterGroupClass = navControlGroupClass;

/** Content-ref category / sort — pill buttons like language switch; active = brand. */
export function contentRefsFilterButtonClass(
	active: boolean,
	className?: string,
): string {
	return cn(
		"tag shrink-0 cursor-pointer rounded-sm px-xs py-min no-underline transition-colors",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent",
		active
			? "bg-color-brand text-color-bg hover:opacity-90"
			: "bg-color-surface-muted text-color-text hover:bg-color-brand hover:text-color-bg",
		className,
	);
}

/** Language switch + theme toggle — pill buttons; active = accent, inactive = muted. */
export function navUtilityButtonClass(
	active: boolean,
	className?: string,
): string {
	return cn(
		"tag shrink-0 cursor-pointer rounded-sm px-xs py-min no-underline transition-colors",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent",
		active
			? "bg-color-accent text-color-bg hover:opacity-90"
			: "bg-color-surface-muted text-color-text hover:bg-color-accent hover:text-color-bg",
		className,
	);
}

/** @deprecated Use {@link navLinkButtonClass} or {@link navUtilityButtonClass}. */
export function navControlButtonClass(
	active: boolean,
	className?: string,
): string {
	return navLinkButtonClass(active, className);
}
