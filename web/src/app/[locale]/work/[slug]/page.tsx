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
import { RichTextMedia } from "@/src/components/text/RichTextMedia";

type PageProps = {
	params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 60 satisfies SanityDocumentCacheRevalidateSeconds;

export async function generateStaticParams() {
	const rows = await cachedProjectSlugs();
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
		fetchProjectBySlug(slug, locale, { stega: false }),
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
		path: `/work/${slug}`,
		siteBrandTitle: siteBrand,
	});
}

export default async function Project({ params }: PageProps) {
	const { slug, locale } = await params;
	const data = await fetchProjectBySlug(slug, locale);

	if (!data) {
		notFound();
	}

	const projectTitle = typeof data.title === "string" ? data.title.trim() : "";
	const titleMedia = data.titleMedia;
	const hasTitleMedia = Boolean(titleMedia?.resolvedMedia?.media);
	const body = data.body ?? [];

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-lg px-md py-max sm:px-container">
				{projectTitle || hasTitleMedia ? (
					<header className="flex flex-col gap-sm">
						{projectTitle ? (
							<h2 className="content-title">{projectTitle}</h2>
						) : null}
					</header>
				) : null}
				{body.length ? (
					<article className="flex flex-col">
						<RichTextMedia value={body} />
					</article>
				) : null}
			</main>
		</div>
	);
}
