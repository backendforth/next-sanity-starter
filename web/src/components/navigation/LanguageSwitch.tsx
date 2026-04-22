"use client";

import { useLanguage } from "@/src/contexts/LanguageContext";
import { cn } from "@/src/utils/cn";

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
		<select
			aria-label="Language"
			className={cn(
				"max-w-[min(100%,11rem)] shrink-0 cursor-pointer rounded-sm border border-color-border-subtle bg-color-bg py-1.5 pl-2 pr-8 text-sm text-color-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent",
				className,
			)}
			value={currentLocale}
			onChange={(e) => {
				const next = e.target.value;
				setLocale(next);
				onAfterLocaleChange?.();
			}}
		>
			{languages.map((languageOption) => (
				<option
					key={languageOption.id}
					value={languageOption.id}
					lang={languageOption.id}
				>
					{languageOption.title}
				</option>
			))}
		</select>
	);
}
