import type { Metadata } from "next";
import { cachedHomeDocument } from "@/sanity/cachedSanityQuery";
import type { SanityDocumentCacheRevalidateSeconds } from "@/sanity/documentCacheRevalidateSeconds";
import { metadataFromSanityPageData } from "@/sanity/seo";
import type { HomeDocument } from "@/sanity/types/pages";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";
import { locales } from "@/src/i18n/config";

type PageProps = {
	params: Promise<{ locale: string }>;
};

/**
 * Next.js 16 segment config must be a numeric literal here (assigning an imported value breaks the check).
 * The literal must match `SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS` — enforced via `satisfies`.
 */
export const revalidate = 60 satisfies SanityDocumentCacheRevalidateSeconds;

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const { data }: { data: HomeDocument | null } = await cachedHomeDocument();
	if (!data) {
		return {
			title: "Site",
			description: undefined,
		};
	}
	return metadataFromSanityPageData(data, locale, "Home");
}

export default async function Home({ params }: PageProps) {
	const { locale } = await params;
	const { data }: { data: HomeDocument | null } = await cachedHomeDocument();

	if (!data) {
		return (
			<div className="flex flex-col flex-1 bg-color-bg">
				<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-6 px-6 py-16 sm:px-8">
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
			<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-10 px-6 py-16 sm:px-8">
				{data.modules?.length ? (
					<section className="flex flex-col gap-4">
						<h2>Modules</h2>
						<ModulesRenderer modules={data.modules} locale={locale} />
					</section>
				) : null}
			</main>
		</div>
	);
}
