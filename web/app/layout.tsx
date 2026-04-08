import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getHome } from "@/sanity/getHome";
import { pickLocalizedString } from "@/sanity/localizedString";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHome();
  if (!home) {
    return {
      title: "Site",
      description: undefined,
    };
  }

  const heading = pickLocalizedString(home.title);
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
