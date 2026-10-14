import type { Metadata } from "next";
import type { SanityDocumentCacheRevalidateSeconds } from "@/sanity/documentCacheRevalidateSeconds";
import {
	fetchSiteChrome,
	fetchSiteLanguageSettings,
	fetchWorkDocument,
} from "@/sanity/fetchSanityData";
import {
	metadataFromSanityPageData,
	siteBrandTitle,
} from "@/sanity/seo/resolveSanityMetadata";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";

type PageProps = {
	params: Promise<{ locale: string }>;
};

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
		fetchWorkDocument(),
		fetchSiteLanguageSettings(),
		fetchSiteChrome(),
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
		segmentFallback: "Work",
		site: chrome?.settings,
		siteLocale,
		path: "/work",
	});
}

export default async function Work({ params }: PageProps) {
	const { locale } = await params;
	const [data, siteLocale] = await Promise.all([
		fetchWorkDocument(),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		return (
			<div className="flex flex-col flex-1 bg-color-bg">
				<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
					<p>
						Work singleton is not in the dataset yet. Create it in Sanity Studio
						(document id <code>work</code>
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
							documentType="work"
						/>
					</section>
				) : null}
			</div>
		</div>
	);
}
