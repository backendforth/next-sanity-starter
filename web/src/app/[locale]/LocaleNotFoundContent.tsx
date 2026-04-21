"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ErrorSettingsDocument } from "@/sanity/types/errorSettings";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import { defaultLocale, isAppLocale } from "@/src/i18n/config";

type Props = {
	errorSettings: ErrorSettingsDocument | null;
};

/**
 * Locale from the URL path (not `headers()`): middleware may strip the default
 * locale prefix, so the first segment is only a locale when it matches `isAppLocale`.
 */
function localeFromPathname(pathname: string | null): string {
	if (!pathname || pathname === "/") {
		return defaultLocale;
	}
	const first = pathname.split("/").filter(Boolean)[0];
	return first && isAppLocale(first) ? first : defaultLocale;
}

export function LocaleNotFoundContent({ errorSettings }: Props) {
	const locale = localeFromPathname(usePathname());

	const title =
		pickLocalizedString(errorSettings?.notFoundTitle, locale) ??
		"Page not found";
	const body = pickLocalizedPortableTextBlocks(
		errorSettings?.notFoundBody,
		locale,
	);

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-6 px-6 py-16 sm:px-8">
				<h1 className="text-3xl font-bold">{title}</h1>
				{body?.length ? (
					<RichTextMedia value={body} />
				) : (
					<p className="text-color-text-muted">
						The page you are looking for does not exist or has been moved.
					</p>
				)}
				<Link
					href={`/${locale}`}
					className="inline-flex items-center gap-2 text-color-link hover:underline"
				>
					Back to home
				</Link>
			</main>
		</div>
	);
}
