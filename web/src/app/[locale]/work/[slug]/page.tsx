import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cachedProjectSlugs } from "@/sanity/cachedSanityQuery";
import {
	fetchProjectBySlug,
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
import { LocaleAlternates } from "@/src/components/navigation/LocaleAlternates";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

type PageProps = {
	params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
	const [rows, siteLocale] = await Promise.all([
		cachedProjectSlugs(),
		fetchSiteLanguageSettings(),
	]);
	const { isAppLocale } = createLanguagePathUtils(siteLocale);
	/* A document in a language the site doesn't serve has no route. */
	return (rows ?? [])
		.filter(
			(row): row is { slug: string; language: string } =>
				typeof row.slug === "string" &&
				row.slug.length > 0 &&
				typeof row.language === "string" &&
				isAppLocale(row.language),
		)
		.map((row) => ({ locale: row.language, slug: row.slug }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug, locale } = await params;
	const [data, siteLocale, chrome] = await Promise.all([
		fetchProjectBySlug(slug, locale),
		fetchSiteLanguageSettings(),
		fetchSiteChrome(locale),
	]);
	/* The page 404s; Next then takes the tab title from `not-found.tsx`, not from here. */
	if (!data) return {};

	return metadataFromSanityPageData({
		data,
		locale,
		segmentFallback: slug,
		site: chrome?.settings,
		siteLocale,
	});
}

export default async function Project({ params }: PageProps) {
	const { slug, locale } = await params;
	const [data, siteLocale] = await Promise.all([
		fetchProjectBySlug(slug, locale),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		notFound();
	}

	const projectTitle = typeof data.title === "string" ? data.title.trim() : "";
	const body = data.body ?? [];

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<LocaleAlternates
				locale={locale}
				path={data.path}
				translations={data.translations}
			/>
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-lg px-md py-max sm:px-container">
				{projectTitle ? (
					<header className="flex flex-col gap-sm">
						<h2 className="content-title">{projectTitle}</h2>
					</header>
				) : null}
				{body.length ? (
					<article className="flex flex-col">
						<RichTextMedia
							value={body}
							locale={locale}
							siteLocale={siteLocale}
							priority
						/>
					</article>
				) : null}
			</div>
		</div>
	);
}
