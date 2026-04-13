import type { Metadata } from "next";
import { headers } from "next/headers";
import { Footer } from "@/src/components/navigation/Footer";
import { Navbar } from "@/src/components/navigation/Navbar";
import {
	defaultLocale,
	isAppLocale,
	LOCALE_HEADER_NAME,
} from "@/src/i18n/config";
import { fetchSiteNavMenus } from "@/sanity/fetchSanityData";
import "../assets/styles/tokens.css";
import "../assets/styles/globals.css";

export const metadata: Metadata = {
	title: {
		default: "Site",
		template: "%s",
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
				<Navbar
					locale={locale}
					mainMenu={siteNav?.mainMenu}
					siteTitle={siteNav?.title}
				/>
				<div className="flex min-h-0 flex-1 flex-col">{children}</div>
				<Footer locale={locale} footerMenu={siteNav?.footerMenu} />
			</body>
		</html>
	);
}
