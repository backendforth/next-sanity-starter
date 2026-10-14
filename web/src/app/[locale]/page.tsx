import type { Metadata } from "next";
import type { SanityDocumentCacheRevalidateSeconds } from "@/sanity/documentCacheRevalidateSeconds";
import {
	fetchHomeDocument,
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import {
	metadataFromSanityPageData,
	siteBrandTitle,
} from "@/sanity/seo/resolveSanityMetadata";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";
import { LocaleAlternates } from "@/src/components/navigation/LocaleAlternates";

type PageProps = {
	params: Promise<{ locale: string }>;
};

/**
 * Next.js 16 segment config must be a numeric literal here (assigning an imported value breaks the check).
 * The literal must match `SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS` — enforced via `satisfies`.
 */
export const revalidate = 60 satisfies SanityDocumentCacheRevalidateSeconds;

export async function generateStaticParams() {
	const siteLocale = await fetchSiteLanguageSettings();
	return siteLocale.localeIds.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const [data, siteLocale, chrome] = await Promise.all([
		fetchHomeDocument(locale),
		fetchSiteLanguageSettings(),
		fetchSiteChrome(locale),
	]);
	if (!data) {
		return {
			title: { absolute: siteBrandTitle(chrome?.settings) },
			description: undefined,
		};
	}
	return metadataFromSanityPageData({
		data,
		locale,
		segmentFallback: "Home",
		site: chrome?.settings,
		siteSeoTitleFirst: true,
		siteLocale,
		path: "/",
	});
}

export default async function Home({ params }: PageProps) {
	const { locale } = await params;
	const [data, siteLocale] = await Promise.all([
		fetchHomeDocument(locale),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		return (
			<div className="flex flex-col flex-1 bg-color-bg">
				<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
					<p>
						No <code>home</code> document for <code>{locale}</code> yet. Create
						one in Sanity Studio.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<LocaleAlternates
				locale={locale}
				path="/"
				translations={data.translations}
			/>
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-lg px-md py-max sm:px-container">
				{data.modules?.length ? (
					<section className="flex flex-col gap-sm">
						<ModulesRenderer
							modules={data.modules}
							documentId={data._id}
							documentType="home"
							locale={locale}
							siteLocale={siteLocale}
						/>
					</section>
				) : null}
			</div>
		</div>
	);
}
