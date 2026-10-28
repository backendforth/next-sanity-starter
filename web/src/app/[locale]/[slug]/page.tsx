import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cachedPageSlugs } from "@/sanity/cachedSanityQuery";
import {
	fetchPageBySlug,
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
import { pageContainerClassName } from "@/src/components/layout/containerStyles";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";

type PageProps = {
	params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
	const [rows, siteLocale] = await Promise.all([
		cachedPageSlugs(),
		fetchSiteLanguageSettings(),
	]);
	const slugs = rows
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
		fetchPageBySlug(slug),
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

export default async function Page({ params }: PageProps) {
	const { slug, locale } = await params;
	const [data, siteLocale] = await Promise.all([
		fetchPageBySlug(slug),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		notFound();
	}

	return (
		<div className={pageContainerClassName}>
			<ModulesRenderer
				modules={data.modules}
				locale={locale}
				siteLocale={siteLocale}
				documentId={data._id}
				documentType="page"
			/>
		</div>
	);
}
