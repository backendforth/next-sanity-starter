import { notFound } from "next/navigation";

import { fetchSiteNavMenus } from "@/sanity/fetchSanityData";
import { Footer } from "@/src/components/navigation/Footer";
import { Header } from "@/src/components/navigation/Header";
import { LanguageProvider } from "@/src/contexts/LanguageContext";
import { isAppLocale } from "@/src/i18n/config";

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
	const { locale: raw } = await params;
	if (!isAppLocale(raw)) {
		notFound();
	}
	const locale = raw;
	const siteNav = await fetchSiteNavMenus();

	return (
		<LanguageProvider locale={locale}>
			<Header mainMenu={siteNav?.mainMenu} siteTitle={siteNav?.title} />
			<div className="flex min-h-0 flex-1 flex-col">{children}</div>
			<Footer locale={locale} footerMenu={siteNav?.footerMenu} />
		</LanguageProvider>
	);
}
