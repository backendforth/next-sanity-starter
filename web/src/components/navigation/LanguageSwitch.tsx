"use client";

import { useLanguage } from "@/src/contexts/LanguageContext";
import { cn } from "@/src/utils/cn";

import {
	navControlGroupClass,
	navUtilityButtonClass,
} from "./navControlStyles";

export type LanguageSwitchProps = {
	className?: string;
	/** After `setLocale` (e.g. close mobile nav). */
	onAfterLocaleChange?: () => void;
};

export function LanguageSwitch({
	className,
	onAfterLocaleChange,
}: LanguageSwitchProps) {
	const { currentLocale, languages, setLocale } = useLanguage();

	return (
		<fieldset
			aria-label="Language"
			className={cn(
				navControlGroupClass,
				"m-0 min-w-0 border-0 p-0",
				className,
			)}
		>
			{languages.map((languageOption) => {
				const active = currentLocale === languageOption.id;
				return (
					<button
						key={languageOption.id}
						type="button"
						lang={languageOption.id}
						className={navUtilityButtonClass(active)}
						aria-pressed={active}
						onClick={() => {
							setLocale(languageOption.id);
							onAfterLocaleChange?.();
						}}
					>
						{languageOption.title}
					</button>
				);
			})}
		</fieldset>
	);
}
