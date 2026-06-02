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

export type Theme = "light" | "dark";

const DEFAULT_THEME: Theme = "light";

type ThemeContextValue = {
	theme: Theme;
	setTheme: (value: Theme) => void;
	toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
	if (typeof window === "undefined") return DEFAULT_THEME;
	try {
		const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
		if (stored === "light" || stored === "dark") {
			return stored;
		}
	} catch {
		// private mode / blocked storage
	}
	return DEFAULT_THEME;
}

/**
 * Mirrors the choice as `data-theme="light" | "dark"` on `<html>`. The
 * `:root[data-theme="dark"]` block in `variables/colors.css` (and the
 * `[data-theme="dark"]` Tailwind `dark:` variant in `tailwind/theme.css`)
 * both key off this attribute. OS preference is intentionally ignored.
 */
function applyThemeToDocument(theme: Theme) {
	document.documentElement.setAttribute("data-theme", theme);
}

type ThemeProviderProps = {
	children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
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

	const toggleTheme = useCallback(() => {
		setTheme(readStoredTheme() === "dark" ? "light" : "dark");
	}, [setTheme]);

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme: mounted ? theme : DEFAULT_THEME,
			setTheme,
			toggleTheme,
		}),
		[mounted, setTheme, theme, toggleTheme],
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
