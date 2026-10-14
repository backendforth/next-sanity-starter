/*
 * The color scheme lives in `data-theme` on `<html>`: `variables/colors.css` and the Tailwind
 * `dark:` variant key off it. The inline script in `DocumentShell` sets it from `localStorage`
 * before the first paint; `ThemeSync` restores it when React recreates `<html>`; `ThemeToggle`
 * reads and writes it. OS preference is intentionally ignored.
 */

export type ColorScheme = "light" | "dark";

/** Same key the inline script in `DocumentShell` reads. */
const STORAGE_KEY = "color-scheme";

export function readStoredColorScheme(): ColorScheme {
	try {
		return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
	} catch {
		return "light"; // private mode / blocked storage
	}
}

export function applyColorScheme(scheme: ColorScheme): void {
	document.documentElement.setAttribute("data-theme", scheme);
}

export function storeColorScheme(scheme: ColorScheme): void {
	try {
		localStorage.setItem(STORAGE_KEY, scheme);
	} catch {
		// private mode / blocked storage: the choice lasts for this page only
	}
	applyColorScheme(scheme);
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
