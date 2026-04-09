import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import {
  defaultLocale,
  LOCALE_HEADER_NAME,
} from "@/src/i18n/config";
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
  const locale = h.get(LOCALE_HEADER_NAME) ?? defaultLocale;

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
        {children}
      </body>
    </html>
  );
}
