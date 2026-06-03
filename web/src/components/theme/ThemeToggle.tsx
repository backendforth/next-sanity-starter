"use client";

import {
	navControlGroupClass,
	navUtilityButtonClass,
} from "@/src/components/navigation/navControlStyles";
import type { Theme } from "@/src/contexts/ThemeContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { cn } from "@/src/utils/cn";

const OPTIONS: { value: Theme; label: string }[] = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<fieldset
			aria-label="Color scheme"
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
						{option.label}
					</button>
				);
			})}
		</fieldset>
	);
}
