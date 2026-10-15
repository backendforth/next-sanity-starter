/**
 * Language / theme toggle groups and content-ref filters — tight gap between options in one
 * control. Each is a `<fieldset>`: preflight clears its margin, padding and border, `min-w-0`
 * its min-content width.
 */
export const navControlGroupClass =
	"inline-flex min-w-0 shrink-0 flex-wrap items-center gap-min";

/** Keyboard focus for every control: an offset outline, no ring-offset colour to set per theme. */
export const FOCUS_RING =
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent";
const PILL = "tag shrink-0 rounded-sm px-xs py-min transition-colors";
const ACTIVE_UNDERLINE =
	"underline decoration-color-link-decoration underline-offset-[0.25rem]";

/**
 * Main menu links + site title — text only; active (the `aria-current` link) = underlined, in
 * the heading color. `muted` (footer) keeps the muted text color in both states, so only the
 * underline marks the active footer link.
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
	const state = active ? ` ${ACTIVE_UNDERLINE}` : "";
	return `text shrink-0 transition-colors ${FOCUS_RING} ${color}${state}`;
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
