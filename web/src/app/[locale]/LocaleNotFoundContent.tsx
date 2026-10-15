"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NotFoundCopy } from "@/sanity/types";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils/sanityLocalizedText";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { uiLabel } from "@/src/i18n/uiLabels";

type Props = {
	/** `errorSettings`' 404 title and body (`fetchSiteChrome().notFound`). */
	copy: NotFoundCopy | null;
};

export function LocaleNotFoundContent({ copy }: Props) {
	const pathname = usePathname() ?? "/";
	const { localeFromPathname, siteLocale, localePath } = useLanguage();
	const locale = localeFromPathname(pathname);

	const title =
		pickLocalizedString(copy?.notFoundTitle, locale, siteLocale) ??
		uiLabel("notFoundTitle", locale);
	const body = pickLocalizedPortableTextBlocks(
		copy?.notFoundBody,
		locale,
		siteLocale,
	);

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
				<h2 className="page-title">{title}</h2>
				{body?.length ? (
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
