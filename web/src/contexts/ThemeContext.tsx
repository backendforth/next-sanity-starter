"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

export const COLOR_SCHEME_STORAGE_KEY = "color-scheme";

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
	theme: Theme;
	setTheme: (value: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
	if (typeof window === "undefined") return "system";
	try {
		const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
		if (stored === "light" || stored === "dark" || stored === "system") {
			return stored;
		}
	} catch {
		// private mode / blocked storage
	}
	return "system";
}

/**
 * Spiegelt die Wahl als `data-theme="light" | "dark"` auf `<html>`; bei `"system"`
 * wird das Attribut entfernt — dadurch greift `@media (prefers-color-scheme: dark)`
 * in `variables/colors.css` ohne weiteres Markup.
 */
function applyThemeToDocument(theme: Theme) {
	const el = document.documentElement;
	if (theme === "system") {
		el.removeAttribute("data-theme");
	} else {
		el.setAttribute("data-theme", theme);
	}
}

type ThemeProviderProps = {
	children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>("system");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const initial = readStoredTheme();
		setThemeState(initial);
		applyThemeToDocument(initial);
		setMounted(true);
	}, []);

	const setTheme = useCallback((value: Theme) => {
		setThemeState(value);
		try {
			localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, value);
		} catch {
			// ignore
		}
		applyThemeToDocument(value);
	}, []);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme: mounted ? theme : "system",
			setTheme,
		}),
		[mounted, setTheme, theme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return ctx;
}
