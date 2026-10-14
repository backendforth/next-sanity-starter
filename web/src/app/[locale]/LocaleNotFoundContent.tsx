"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NotFoundCopy } from "@/sanity/types";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { uiLabel } from "@/src/i18n/uiLabels";

type Props = {
	/** The 404 copy of every language (`fetchNotFoundCopy`) — one `errorSettings` per language. */
	copies: readonly NotFoundCopy[];
};

export function LocaleNotFoundContent({ copies }: Props) {
	const pathname = usePathname() ?? "/";
	const { defaultLocale, localeFromPathname, localePath, siteLocale } =
		useLanguage();
	const locale = localeFromPathname(pathname);
	const copy =
		copies.find((entry) => entry.language === locale) ??
		copies.find((entry) => entry.language === defaultLocale);

	const title = copy?.notFoundTitle?.trim() || uiLabel("notFoundTitle", locale);
	const body = copy?.notFoundBody ?? [];

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
				<h2 className="page-title">{title}</h2>
				{body.length ? (
					<RichTextMedia value={body} locale={locale} siteLocale={siteLocale} />
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
