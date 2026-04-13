import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import { fetchPageBySlug } from "@/sanity/fetchSanityData";
import { pageSlugsQuery } from "@/sanity/queries";
import { pickLocalizedString } from "@/sanity/utils";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";
import { locales } from "@/src/i18n/config";

type PageProps = {
	params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
	const rows = await client.fetch<Array<{ slug: string }>>(pageSlugsQuery);
	const slugs = rows
		.map((row) => row.slug)
		.filter((s): s is string => typeof s === "string" && s.length > 0);

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
	const doc = await fetchPageBySlug(slug);
	if (!doc) {
		return { title: "Not found" };
	}

	const heading = pickLocalizedString(doc.title, locale);
	const metaTitle = doc.seo?.title?.trim() || heading || slug;
	const description = doc.seo?.description?.trim() || undefined;
	const ogImage = doc.seo?.imageUrl || undefined;

	return {
		title: metaTitle,
		description,
		openGraph: {
			title: metaTitle,
			description,
			...(ogImage ? { images: [{ url: ogImage }] } : {}),
		},
	};
}

export default async function Page({ params }: PageProps) {
	const { slug, locale } = await params;
	const doc = await fetchPageBySlug(slug);

	if (!doc) {
		notFound();
	}

	const heading = pickLocalizedString(doc.title, locale) ?? slug;
	const modules = doc.modules ?? [];

	return (
		<div className="flex flex-col flex-1">
			<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16 sm:px-8">
				<header className="flex flex-col gap-2">
					<h1>{heading}</h1>
					<p>/{doc.slug?.current ?? slug}</p>
				</header>

				{modules.length > 0 ? (
					<section className="flex flex-col gap-4">
						<h2>Modules</h2>
						<ModulesRenderer modules={modules} locale={locale} />
					</section>
				) : (
					<p>No modules on this page yet. Add modules in Sanity Studio.</p>
				)}
			</main>
		</div>
	);
}
