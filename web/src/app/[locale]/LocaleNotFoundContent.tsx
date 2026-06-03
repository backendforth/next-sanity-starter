"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ErrorSettingsDocument } from "@/sanity/types/errorSettings";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils/sanityLocalizedText";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import { useLanguage } from "@/src/contexts/LanguageContext";

type Props = {
	errorSettings: ErrorSettingsDocument | null;
};

export function LocaleNotFoundContent({ errorSettings }: Props) {
	const pathname = usePathname() ?? "/";
	const { localeFromPathname, siteLocale, localePath } = useLanguage();
	const locale = localeFromPathname(pathname);

	const title =
		pickLocalizedString(errorSettings?.notFoundTitle, locale, siteLocale) ??
		"Page not found";
	const body = pickLocalizedPortableTextBlocks(
		errorSettings?.notFoundBody,
		locale,
		siteLocale,
	);

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
				<h2 className="page-title">{title}</h2>
				{body?.length ? (
					<RichTextMedia value={body} />
				) : (
					<p className="text-color-text-muted">
						The page you are looking for does not exist or has been moved.
					</p>
				)}
				<Link
					href={localePath("/", locale)}
					className="inline-flex items-center gap-xs text-color-link hover:text-color-hover"
				>
					Back to home
				</Link>
			</main>
		</div>
	);
}
