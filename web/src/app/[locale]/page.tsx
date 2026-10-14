import type { Metadata } from "next";
import {
	fetchHomeDocument,
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
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
			<div className="flex flex-col flex-1 bg-color-bg">
				<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
					<p>
						Home singleton is not in the dataset yet. Create it in Sanity Studio
						(document id <code>home</code>
						).
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-lg px-md py-max sm:px-container">
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
			</div>
		</div>
	);
}
