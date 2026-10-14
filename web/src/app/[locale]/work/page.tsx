import type { Metadata } from "next";
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
		fetchWorkDocument(locale),
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
		segmentFallback: "Work",
		site: chrome?.settings,
		siteLocale,
		path: "/work",
	});
}

export default async function Work({ params }: PageProps) {
	const { locale } = await params;
	const [data, siteLocale] = await Promise.all([
		fetchWorkDocument(locale),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		return (
			<div className="flex flex-col flex-1 bg-color-bg">
				<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
					<p>
						No <code>work</code> document for locale <code>{locale}</code> yet.
						Create one in Sanity Studio.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<LocaleAlternates
				locale={locale}
				path="/work"
				translations={data.translations}
			/>
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-lg px-md py-max sm:px-container">
				{data.modules?.length ? (
					<section className="flex flex-col gap-sm">
						<ModulesRenderer
							modules={data.modules}
							documentId={data._id}
							documentType="work"
							locale={locale}
							siteLocale={siteLocale}
						/>
					</section>
				) : null}
			</div>
		</div>
	);
}
