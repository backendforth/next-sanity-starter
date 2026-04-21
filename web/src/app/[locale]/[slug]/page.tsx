import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPageBySlug } from "@/sanity/fetchSanityData";
import { sanityFetch } from "@/sanity/live";
import { pageSlugsQuery } from "@/sanity/queries";
import { metadataFromSanityPageData } from "@/sanity/seo";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";
import { locales } from "@/src/i18n/config";

type PageProps = {
	params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
	const { data: rows } = await sanityFetch({
		query: pageSlugsQuery,
		perspective: "published",
		stega: false,
	});
	const list = (rows ?? []) as Array<{ slug?: string }>;
	const slugs = list
		.map((row: { slug?: string }) => row.slug)
		.filter(
			(s: string | undefined): s is string =>
				typeof s === "string" && s.length > 0,
		);

	const out: { locale: string; slug: string }[] = [];
	for (const locale of locales) {
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
	const data = await fetchPageBySlug(slug, { stega: false });
	if (!data) {
		return {
			title: "Not found",
			description: undefined,
		};
	}

	return metadataFromSanityPageData(data, locale, slug);
}

export default async function Page({ params }: PageProps) {
	const { slug, locale } = await params;
	const data = await fetchPageBySlug(slug);

	if (!data) {
		notFound();
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
