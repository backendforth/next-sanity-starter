import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cachedPageSlugs } from "@/sanity/cachedSanityQuery";
import {
	fetchPageBySlug,
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";
import { LocaleAlternates } from "@/src/components/navigation/LocaleAlternates";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

type PageProps = {
	params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
	const [rows, siteLocale] = await Promise.all([
		cachedPageSlugs(),
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
		fetchPageBySlug(slug, locale),
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

export default async function Page({ params }: PageProps) {
	const { slug, locale } = await params;
	const [data, siteLocale] = await Promise.all([
		fetchPageBySlug(slug, locale),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		notFound();
	}

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<LocaleAlternates
				locale={locale}
				path={data.path}
				translations={data.translations}
			/>
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-lg px-md py-max sm:px-container">
				{data.modules?.length ? (
					<section className="flex flex-col gap-sm">
						<ModulesRenderer
							modules={data.modules}
							locale={locale}
							siteLocale={siteLocale}
							documentId={data._id}
							documentType="page"
						/>
					</section>
				) : null}
			</div>
		</div>
	);
}
