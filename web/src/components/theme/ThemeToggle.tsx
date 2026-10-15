"use client";

import {
	navControlGroupClass,
	navUtilityButtonClass,
} from "@/src/components/navigation/navControlStyles";
import { useLanguage } from "@/src/contexts/LanguageContext";
import type { Theme } from "@/src/contexts/ThemeContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { type UiLabelKey, uiLabel } from "@/src/i18n/uiLabels";
import { cn } from "@/src/utils/cn";

const OPTIONS: { value: Theme; label: UiLabelKey }[] = [
	{ value: "light", label: "themeLight" },
	{ value: "dark", label: "themeDark" },
];

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
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
						onClick={() => setTheme(option.value)}
					>
						{uiLabel(option.label, currentLocale)}
					</button>
				);
			})}
		</fieldset>
	);
}
