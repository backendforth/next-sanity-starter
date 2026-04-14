import type { Metadata } from "next";
import { headers } from "next/headers";
import { fetchSiteNavMenus } from "@/sanity/fetchSanityData";
import { Footer } from "@/src/components/navigation/Footer";
import { Header } from "@/src/components/navigation/Header";
import { LanguageProvider } from "@/src/contexts/LanguageContext";
import {
	defaultLocale,
	isAppLocale,
	LOCALE_HEADER_NAME,
} from "@/src/i18n/config";
import "../assets/styles/tokens.css";
import "../assets/styles/globals.css";

export const metadata: Metadata = {
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
	),
	title: {
		default: "Site",
		template: "%s | Site",
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const h = await headers();
	const rawLocale = h.get(LOCALE_HEADER_NAME) ?? defaultLocale;
	const locale = isAppLocale(rawLocale) ? rawLocale : defaultLocale;
	const siteNav = await fetchSiteNavMenus();

	return (
		<html lang={locale} className="h-full antialiased" suppressHydrationWarning>
			<body className="min-h-full flex flex-col bg-color-bg text-color-text font-text">
				<LanguageProvider locale={locale}>
					<Header mainMenu={siteNav?.mainMenu} siteTitle={siteNav?.title} />
					<div className="flex min-h-0 flex-1 flex-col">{children}</div>
					<Footer locale={locale} footerMenu={siteNav?.footerMenu} />
				</LanguageProvider>
			</body>
		</html>
	);
}
