import type { Metadata } from "next";
import Script from "next/script";
import { getHome } from "@/sanity/getHome";
import { pickLocalizedString } from "@/sanity/localizedString";
import "../assets/css/_globals.css";

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bgColor text-textColor">
        <Script id="prefers-dark" strategy="beforeInteractive">
          {`(function(){try{var d=document.documentElement;if(window.matchMedia("(prefers-color-scheme: dark)").matches)d.classList.add("dark");}catch(e){}})()`}
        </Script>
        {children}
      </body>
    </html>
  );
}
