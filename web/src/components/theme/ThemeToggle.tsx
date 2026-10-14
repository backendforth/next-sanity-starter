"use client";

import { useSyncExternalStore } from "react";

import {
	navControlGroupClass,
	navUtilityButtonClass,
} from "@/src/components/navigation/navControlStyles";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { type UiLabelKey, uiLabel } from "@/src/i18n/uiLabels";
import { cn } from "@/src/utils/cn";

import {
	type ColorScheme,
	readAppliedColorScheme,
	storeColorScheme,
	subscribeToColorScheme,
} from "./colorScheme";

const OPTIONS: { value: ColorScheme; label: UiLabelKey }[] = [
	{ value: "light", label: "themeLight" },
	{ value: "dark", label: "themeDark" },
];

/** Hydration renders the server snapshot (`light`), so the markup matches; the stored value applies right after. */
const serverColorScheme = (): ColorScheme => "light";

export function ThemeToggle() {
	const theme = useSyncExternalStore(
		subscribeToColorScheme,
		readAppliedColorScheme,
		serverColorScheme,
	);
	const { currentLocale } = useLanguage();

	return (
		<fieldset
			aria-label={uiLabel("colorScheme", currentLocale)}
			className={cn(navControlGroupClass, "m-0 min-w-0 border-0 p-0")}
		>
			{OPTIONS.map((option) => {
				const selected = theme === option.value;
				return (
					<button
						key={option.value}
						type="button"
						className={navUtilityButtonClass(selected)}
						aria-pressed={selected}
						onClick={() => storeColorScheme(option.value)}
					>
						{uiLabel(option.label, currentLocale)}
					</button>
				);
			})}
		</fieldset>
	);
}
