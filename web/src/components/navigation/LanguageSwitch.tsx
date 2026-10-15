"use client";

import { useLanguage } from "@/src/contexts/LanguageContext";
import { uiLabel } from "@/src/i18n/uiLabels";

import {
	navControlGroupClass,
	navUtilityButtonClass,
} from "./navControlStyles";

export type LanguageSwitchProps = {
	/** After `setLocale` (e.g. close mobile nav). */
	onAfterLocaleChange?: () => void;
};

export function LanguageSwitch({ onAfterLocaleChange }: LanguageSwitchProps) {
	const { currentLocale, languages, setLocale } = useLanguage();

	return (
		<fieldset
			aria-label={uiLabel("language", currentLocale)}
			className={`${navControlGroupClass} m-0 min-w-0 border-0 p-0`}
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
