import type { Metadata } from "next";
import {
	fetchHomeDocument,
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
import { pageContainerClassName } from "@/src/components/layout/containerStyles";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";
import { LocaleAlternates } from "@/src/components/navigation/LocaleAlternates";

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
		fetchHomeDocument(locale),
		fetchSiteLanguageSettings(),
		fetchSiteChrome(locale),
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
		fetchHomeDocument(locale),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		return (
			<div className={pageContainerClassName}>
				<p>
					No <code>home</code> document for <code>{locale}</code> yet. Create
					one in Sanity Studio.
				</p>
			</div>
		);
	}

	return (
		<div className={pageContainerClassName}>
			<LocaleAlternates
				locale={locale}
				path={data.path}
				translations={data.translations}
			/>
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
