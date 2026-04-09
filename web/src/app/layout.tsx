import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import { Footer } from "@/src/components/navigation/Footer";
import { Navbar } from "@/src/components/navigation/Navbar";
import {
	defaultLocale,
	isAppLocale,
	LOCALE_HEADER_NAME,
} from "@/src/i18n/config";
import { fetchSiteNavMenus } from "@/sanity/fetchSanityData";
import "../assets/css/_globals.css";

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

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
		<html
			lang={locale}
			className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
			suppressHydrationWarning
		>
			<body className="min-h-full flex flex-col bg-bgColor text-textColor font-sans">
				<Script id="prefers-dark" strategy="beforeInteractive">
					{`(function(){try{var d=document.documentElement;if(window.matchMedia("(prefers-color-scheme: dark)").matches)d.classList.add("dark");}catch(e){}})()`}
				</Script>
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
