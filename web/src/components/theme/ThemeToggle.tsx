"use client";

import type { Theme } from "@/src/contexts/ThemeContext";
import { useTheme } from "@/src/contexts/ThemeContext";

const OPTIONS: { value: Theme; label: string }[] = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "system", label: "System" },
];

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<fieldset className="inline-flex w-fit shrink-0 rounded-sm border border-color-border-subtle p-0.5 text-sm">
			<legend className="sr-only">Color scheme</legend>
			{OPTIONS.map((option) => {
				const selected = theme === option.value;
				return (
					<button
						key={option.value}
						type="button"
						className={`rounded-sm px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-color-accent ${
							selected
								? "bg-color-surface-muted font-medium text-color-heading"
								: "text-color-text-muted hover:text-color-text"
						}`}
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
