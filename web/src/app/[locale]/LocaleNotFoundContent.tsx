"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ErrorSettingsDocument } from "@/sanity/types/errorSettings";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { uiLabel } from "@/src/i18n/uiLabels";

type Props = {
	/** `errorSettings` per locale id — one document per language. */
	errorSettingsByLocale: Readonly<Record<string, ErrorSettingsDocument | null>>;
};

export function LocaleNotFoundContent({ errorSettingsByLocale }: Props) {
	const pathname = usePathname() ?? "/";
	const { defaultLocale, localeFromPathname, localePath } = useLanguage();
	const locale = localeFromPathname(pathname);
	const errorSettings =
		errorSettingsByLocale[locale] ??
		errorSettingsByLocale[defaultLocale] ??
		null;

	const title =
		errorSettings?.notFoundTitle?.trim() || uiLabel("notFoundTitle", locale);
	const body = errorSettings?.notFoundBody ?? [];

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
				<h2 className="page-title">{title}</h2>
				{body.length ? (
					<RichTextMedia value={body} />
				) : (
					<p className="text-color-text-muted">
						{uiLabel("notFoundBody", locale)}
					</p>
				)}
				<Link
					href={localePath("/", locale)}
					className="inline-flex items-center gap-xs text-color-link hover:text-color-hover"
				>
					{uiLabel("backHome", locale)}
				</Link>
			</div>
		</div>
	);
}
