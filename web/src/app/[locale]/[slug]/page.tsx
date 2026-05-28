import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cachedPageSlugs } from "@/sanity/cachedSanityQuery";
import type { SanityDocumentCacheRevalidateSeconds } from "@/sanity/documentCacheRevalidateSeconds";
import {
	fetchPageBySlug,
	fetchSettingsSeoFallback,
	fetchSiteLanguageSettings,
	fetchSiteSettingsTitle,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";

type PageProps = {
	params: Promise<{ locale: string; slug: string }>;
};

/**
 * Next.js 16 segment config must be a numeric literal here (assigning an imported value breaks the check).
 * The literal must match `SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS` — enforced via `satisfies`.
 */
export const revalidate = 60 satisfies SanityDocumentCacheRevalidateSeconds;

export async function generateStaticParams() {
	const rows = await cachedPageSlugs();
	return (rows ?? [])
		.filter(
			(row): row is { slug: string; language: string } =>
				typeof row.slug === "string" &&
				row.slug.length > 0 &&
				typeof row.language === "string" &&
				row.language.length > 0,
		)
		.map((row) => ({ locale: row.language, slug: row.slug }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug, locale } = await params;
	const [data, siteLocale, siteBrand, settingsSeo] = await Promise.all([
		fetchPageBySlug(slug, locale, { stega: false }),
		fetchSiteLanguageSettings({ stega: false }),
		fetchSiteSettingsTitle(locale, { stega: false }),
		fetchSettingsSeoFallback(locale, { stega: false }),
	]);
	if (!data) {
		return {
			title: "Not found",
			description: undefined,
		};
	}

	return metadataFromSanityPageData({
		data,
		locale,
		segmentFallback: slug,
		settingsSeo,
		siteLocale,
		path: `/${slug}`,
		siteBrandTitle: siteBrand,
	});
}

export default async function Page({ params }: PageProps) {
	const { slug, locale } = await params;
	const data = await fetchPageBySlug(slug, locale);

	if (!data) {
		notFound();
	}

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-10 px-6 py-16 sm:px-8">
				{data.modules?.length ? (
					<section className="flex flex-col gap-4">
						<h2>Modules</h2>
						<ModulesRenderer
							modules={data.modules}
							documentId={data._id}
							documentType="page"
						/>
					</section>
				) : null}
			</main>
		</div>
	);
}
