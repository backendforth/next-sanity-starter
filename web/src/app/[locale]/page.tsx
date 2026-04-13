import type { Metadata } from "next";
import { ModulesRenderer } from "@/src/components/modules/ModulesRenderer";
import { fetchHomeDocument } from "@/sanity/fetchSanityData";
import { pickLocalizedString } from "@/sanity/utils";
import { locales } from "@/src/i18n/config";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const home = await fetchHomeDocument();
	if (!home) {
		return {
			title: "Site",
			description: undefined,
		};
	}

	const heading = pickLocalizedString(home.title, locale);
	const metaTitle = home.seo?.title?.trim() || heading || "Home";
	const description = home.seo?.description?.trim() || undefined;
	const ogImage = home.seo?.imageUrl || undefined;

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

export default async function Home({ params }: PageProps) {
	const { locale } = await params;
	const home = await fetchHomeDocument();

	if (!home) {
		return (
			<div className="flex flex-col flex-1 bg-color-bg">
				<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16 sm:px-8">
					<p>
						Home singleton is not in the dataset yet. Create it in Sanity Studio
						(document id <code>home</code>
						).
					</p>
				</main>
			</div>
		);
	}

	const heading = pickLocalizedString(home.title, locale) ?? "Home";
	const modules = home.modules ?? [];

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16 sm:px-8">
				<header className="flex flex-col gap-2">
					<h1>{heading}</h1>
					<p>/</p>
				</header>

				{modules.length > 0 ? (
					<section className="flex flex-col gap-4">
						<h2>Modules</h2>
						<ModulesRenderer modules={modules} locale={locale} />
					</section>
				) : (
					<p>No modules on the home page yet. Add modules in Sanity Studio.</p>
				)}
			</main>
		</div>
	);
}
