import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cachedProjectSlugs } from "@/sanity/cachedSanityQuery";
import type { SanityDocumentCacheRevalidateSeconds } from "@/sanity/documentCacheRevalidateSeconds";
import {
	fetchProjectBySlug,
	fetchSettingsSeoFallback,
	fetchSiteLanguageSettings,
	fetchSiteSettingsTitle,
} from "@/sanity/fetchSanityData";
import { metadataFromSanityPageData } from "@/sanity/seo/resolveSanityMetadata";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils/sanityLocalizedText";
// import { ModuleMedia } from "@/src/components/modules/ModuleMedia";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";

type PageProps = {
	params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 60 satisfies SanityDocumentCacheRevalidateSeconds;

export async function generateStaticParams() {
	const [rows, siteLocale] = await Promise.all([
		cachedProjectSlugs(),
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
		fetchProjectBySlug(slug, { stega: false }),
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
		path: `/work/${slug}`,
		siteBrandTitle: siteBrand,
	});
}

export default async function Project({ params }: PageProps) {
	const { slug, locale } = await params;
	const [data, siteLocale] = await Promise.all([
		fetchProjectBySlug(slug),
		fetchSiteLanguageSettings(),
	]);

	if (!data) {
		notFound();
	}

	const projectTitle = pickLocalizedString(data.title, locale, siteLocale);
	const titleMedia = data.titleMedia;
	const hasTitleMedia = Boolean(titleMedia?.resolvedMedia?.media);
	const body = pickLocalizedPortableTextBlocks(data.body, locale, siteLocale);

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-lg px-md py-max sm:px-container">
				{projectTitle || hasTitleMedia ? (
					<header className="flex flex-col gap-sm">
						{projectTitle ? (
							<h2 className="content-title">{projectTitle}</h2>
						) : null}
						{/* Title media — kept for later; not rendered on the page yet.
						{hasTitleMedia && titleMedia ? (
							<ModuleMedia module={titleMedia} />
						) : null}
						*/}
					</header>
				) : null}
				{body.length ? (
					<article className="flex flex-col">
						<RichTextMedia
							value={body}
							locale={locale}
							siteLocale={siteLocale}
						/>
					</article>
				) : null}
			</main>
		</div>
	);
}
