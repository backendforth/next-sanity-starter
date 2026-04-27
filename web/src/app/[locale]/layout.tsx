import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
	fetchSiteLanguageSettings,
	fetchSiteNavMenus,
	fetchSiteSettingsTitle,
} from "@/sanity/fetchSanityData";
import { Footer } from "@/src/components/navigation/Footer";
import { Header } from "@/src/components/navigation/Header";
import { LanguageProvider } from "@/src/contexts/LanguageContext";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

/** New locales from Sanity after deploy are still routable (not limited to `generateStaticParams` at build). */
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale: raw } = await params;
	const [siteLocale, siteTitle] = await Promise.all([
		fetchSiteLanguageSettings({ stega: false }),
		fetchSiteSettingsTitle({ stega: false }),
	]);
	const pathUtils = createLanguagePathUtils(siteLocale);
	if (!pathUtils.isAppLocale(raw)) {
		notFound();
	}
	const suffix = siteTitle.trim() || "Site";
	return {
		title: {
			default: suffix,
			template: `%s | ${suffix}`,
		},
	};
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale: raw } = await params;
	const siteLocale = await fetchSiteLanguageSettings();
	const pathUtils = createLanguagePathUtils(siteLocale);

	if (!pathUtils.isAppLocale(raw)) {
		notFound();
	}
	const locale = raw;
	const siteNav = await fetchSiteNavMenus();

	return (
		<LanguageProvider locale={locale} siteLocaleConfig={siteLocale}>
			<Header mainMenu={siteNav?.mainMenu} siteTitle={siteNav?.title} />
			<div className="flex min-h-0 flex-1 flex-col">{children}</div>
			<Footer
				locale={locale}
				footerMenu={siteNav?.footerMenu}
				pathUtils={pathUtils}
			/>
		</LanguageProvider>
	);
}
