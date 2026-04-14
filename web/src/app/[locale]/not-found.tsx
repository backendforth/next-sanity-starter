import { headers } from "next/headers";
import Link from "next/link";
import { fetchErrorSettings } from "@/sanity/fetchSanityData";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import { defaultLocale, LOCALE_HEADER_NAME } from "@/src/i18n/config";

export default async function NotFound() {
	const headersList = await headers();
	const locale = headersList.get(LOCALE_HEADER_NAME) ?? defaultLocale;
	const errorSettings = await fetchErrorSettings();

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
