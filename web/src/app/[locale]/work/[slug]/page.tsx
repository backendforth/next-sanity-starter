import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cachedProjectSlugs } from "@/sanity/cachedSanityQuery";
import {
	fetchProjectBySlug,
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils/sanityLocalizedText";
import { pageContainerClassName } from "@/src/components/layout/containerStyles";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";

type PageProps = {
	params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
	const [rows, siteLocale] = await Promise.all([
		cachedProjectSlugs(),
		fetchSiteLanguageSettings(),
	]);
	const list = rows ?? [];
	const slugs = list
		.map((row) => row.slug)
		.filter(
			(s: string | undefined): s is string =>
				typeof s === "string" && s.length > 0,
		);

	const out: { locale: string; slug: string }[] = [];
	for (const locale of siteLocale.localeIds) {
		for (const slug of slugs) {
			out.push({ locale, slug });
		}
	}
	return out;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug, locale } = await params;
	const [data, siteLocale, chrome] = await Promise.all([
		fetchProjectBySlug(slug),
		fetchSiteLanguageSettings(),
		fetchSiteChrome(),
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
		fetchProjectBySlug(slug),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		notFound();
	}

	const projectTitle = pickLocalizedString(data.title, locale, siteLocale);
	const body = pickLocalizedPortableTextBlocks(data.body, locale, siteLocale);

	return (
		<div className={pageContainerClassName}>
			{projectTitle ? <h2 className="heading-1">{projectTitle}</h2> : null}
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
	);
}
