/*
 * The color scheme lives in `data-theme` on `<html>`: `variables/colors.css` and the Tailwind
 * `dark:` variant key off it. `applyBootState` sets it from `localStorage` before the first paint
 * and again when React recreates `<html>`; `ThemeToggle` reads and writes it. OS preference is
 * intentionally ignored.
 */

export type ColorScheme = "light" | "dark";

/** Same key `applyBootState` reads. */
const STORAGE_KEY = "color-scheme";

/**
 * Puts the state the CSS keys off onto `<html>`:
 * - the stored scheme as `data-theme` (light without a stored choice or without storage);
 * - `js-enabled`, so lazy images can start at opacity 0 (`animations.css`). The `img-loaded`
 *   class is `MediaImage`'s, set in an effect so SSR and the first client render agree.
 *
 * `DocumentShell` inlines this function's source as the blocking boot script, and `ThemeSync`
 * calls it again after a root-layout remount. Inlined, it can't see module scope, so the
 * storage key is a literal and it calls nothing else from this file.
 */
export function applyBootState(): void {
	const root = document.documentElement;
	let dark = false;
	try {
		dark = localStorage.getItem("color-scheme") === "dark";
	} catch {
		/* blocked storage: light */
	}
	root.setAttribute("data-theme", dark ? "dark" : "light");
	root.classList.add("js-enabled");
}

export function storeColorScheme(scheme: ColorScheme): void {
	try {
		localStorage.setItem(STORAGE_KEY, scheme);
	} catch {
		// private mode / blocked storage: the choice lasts for this page only
	}
	document.documentElement.setAttribute("data-theme", scheme);
}

export function readAppliedColorScheme(): ColorScheme {
	return document.documentElement.getAttribute("data-theme") === "dark"
		? "dark"
		: "light";
}

export function subscribeToColorScheme(callback: () => void): () => void {
	const observer = new MutationObserver(callback);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme"],
	});
	return () => observer.disconnect();
}
