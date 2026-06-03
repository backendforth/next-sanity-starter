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
	const [rows, siteLocale] = await Promise.all([
		cachedPageSlugs(),
		fetchSiteLanguageSettings({ stega: false }),
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
	const [data, siteLocale, siteBrand, settingsSeo] = await Promise.all([
		fetchPageBySlug(slug, { stega: false }),
		fetchSiteLanguageSettings({ stega: false }),
		fetchSiteSettingsTitle({ stega: false }),
		fetchSettingsSeoFallback({ stega: false }),
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
	const [data, siteLocale] = await Promise.all([
		fetchPageBySlug(slug),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		notFound();
	}

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-lg px-md py-max sm:px-container">
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
			</main>
		</div>
	);
}
