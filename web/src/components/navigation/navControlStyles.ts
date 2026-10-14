/** Language / theme toggle groups and content-ref filters — tight gap between options in one control. */
export const navControlGroupClass =
	"inline-flex shrink-0 flex-wrap items-center gap-min";

const FOCUS_RING =
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent";
const PILL =
	"tag shrink-0 cursor-pointer rounded-sm px-xs py-min no-underline transition-colors";

/**
 * Main menu links + site title — text only; active = heading color. `muted` (footer) keeps the
 * muted text color in both states, so an active footer link reads like the others.
 */
export function navLinkButtonClass(
	active: boolean,
	tone: "default" | "muted" = "default",
): string {
	const color =
		tone === "muted"
			? active
				? "text-color-text-muted"
				: "hover:text-color-link text-color-text-muted"
			: active
				? "text-color-heading"
				: "text-color-text hover:text-color-link";
	return `nav-menu shrink-0 font-normal transition-colors ${FOCUS_RING} ${color}`;
}

/** Content-ref category / sort — pill buttons like language switch; active = brand. */
export function contentRefsFilterButtonClass(active: boolean): string {
	const color = active
		? "bg-color-brand text-color-bg hover:opacity-90"
		: "bg-color-surface-muted text-color-text hover:bg-color-brand hover:text-color-bg";
	return `${PILL} ${FOCUS_RING} ${color}`;
}

/** Language switch + theme toggle — pill buttons; active = accent, inactive = muted. */
export function navUtilityButtonClass(active: boolean): string {
	const color = active
		? "bg-color-accent text-color-bg hover:opacity-90"
		: "bg-color-surface-muted text-color-text hover:bg-color-accent hover:text-color-bg";
	return `${PILL} ${FOCUS_RING} ${color}`;
}
