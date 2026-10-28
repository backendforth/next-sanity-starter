import type { Metadata } from "next";
import {
	fetchHomeDocument,
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
import { pageContainerClassName } from "@/src/components/layout/containerStyles";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
	const siteLocale = await fetchSiteLanguageSettings();
	return siteLocale.localeIds.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const [data, siteLocale, chrome] = await Promise.all([
		fetchHomeDocument(),
		fetchSiteLanguageSettings(),
		fetchSiteChrome(),
	]);
	/* No document: the layout's `title.default` (the brand) applies. */
	if (!data) return {};
	return metadataFromSanityPageData({
		data,
		locale,
		segmentFallback: "Home",
		site: chrome?.settings,
		siteSeoTitleFirst: true,
		siteLocale,
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
			<div className={pageContainerClassName}>
				<p>
					Home singleton is not in the dataset yet. Create it in Sanity Studio
					(document id <code>home</code>
					).
				</p>
			</div>
		);
	}

	return (
		<div className={pageContainerClassName}>
			<ModulesRenderer
				modules={data.modules}
				locale={locale}
				siteLocale={siteLocale}
				documentId={data._id}
				documentType="home"
			/>
		</div>
	);
}
