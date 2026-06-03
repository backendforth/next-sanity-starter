import type { Metadata } from "next";
import type { SanityDocumentCacheRevalidateSeconds } from "@/sanity/documentCacheRevalidateSeconds";
import {
	fetchHomeDocument,
	fetchSettingsSeoFallback,
	fetchSiteLanguageSettings,
	fetchSiteSettingsTitle,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";

type PageProps = {
	params: Promise<{ locale: string }>;
};

/**
 * Next.js 16 segment config must be a numeric literal here (assigning an imported value breaks the check).
 * The literal must match `SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS` — enforced via `satisfies`.
 */
export const revalidate = 60 satisfies SanityDocumentCacheRevalidateSeconds;

export async function generateStaticParams() {
	const siteLocale = await fetchSiteLanguageSettings({ stega: false });
	return siteLocale.localeIds.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const [data, siteLocale, siteBrand, settingsSeo] = await Promise.all([
		fetchHomeDocument({ stega: false }),
		fetchSiteLanguageSettings({ stega: false }),
		fetchSiteSettingsTitle({ stega: false }),
		fetchSettingsSeoFallback({ stega: false }),
	]);
	if (!data) {
		return {
			title: { absolute: siteBrand },
			description: undefined,
		};
	}
	return metadataFromSanityPageData({
		data,
		locale,
		segmentFallback: "Home",
		settingsSeo,
		siteLocale,
		path: "/",
		siteBrandTitle: siteBrand,
	});
}

export default async function Home({ params }: PageProps) {
	const { locale } = await params;
	const [data, siteLocale] = await Promise.all([
		fetchHomeDocument(),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		return (
			<div className="flex flex-col flex-1 bg-color-bg">
				<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
					<p>
						Home singleton is not in the dataset yet. Create it in Sanity Studio
						(document id <code>home</code>
						).
					</p>
				</main>
			</div>
		);
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
							documentType="home"
						/>
					</section>
				) : null}
			</main>
		</div>
	);
}
