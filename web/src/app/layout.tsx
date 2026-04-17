import type { Metadata } from "next";
import { draftMode, headers } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
// import localFont from "next/font/local";
import { fetchSiteNavMenus } from "@/sanity/fetchSanityData";
import { SanityLive } from "@/sanity/live";
import { Footer } from "@/src/components/navigation/Footer";
import { Header } from "@/src/components/navigation/Header";
import { DisableDraftMode } from "@/src/components/sanity/DisableDraftMode";
import { LanguageProvider } from "@/src/contexts/LanguageContext";
import {
	defaultLocale,
	isAppLocale,
	LOCALE_HEADER_NAME,
} from "@/src/i18n/config";
import "../assets/styles/tokens.css";
import "../assets/styles/globals.css";

// ── Fonts ─────────────────────────────────────────────────────────────────────
//
// next/font/local handles subsetting, preload, and zero-CLS font-face injection
// automatically — no manual @font-face or <link rel="preload"> needed.
//
// Setup (once real woff2 files are placed in `web/src/assets/fonts/`):
//   1. Drop in your font files, e.g.:
//        web/src/assets/fonts/YourSans-Regular.woff2
//        web/src/assets/fonts/YourSans-Bold.woff2
//        web/src/assets/fonts/YourSerif-Regular.woff2
//   2. Uncomment the block below and update paths + weights.
//   3. Add the .variable classes to <html> (see below).
//   4. Remove @font-face rules from fonts.css — next/font replaces them.
//
// const sans = localFont({
//   src: [
//     { path: "../../assets/fonts/YourSans-Regular.woff2", weight: "400", style: "normal" },
//     { path: "../../assets/fonts/YourSans-Bold.woff2",    weight: "700", style: "normal" },
//   ],
//   variable: "--font-family-sans",
//   display: "swap",  // or "optional" for guaranteed-zero CLS (text hidden until loaded)
//   preload: true,    // emits <link rel="preload"> for the first weight in `src`
// });
//
// const serif = localFont({
//   src: "../../assets/fonts/YourSerif-Regular.woff2",
//   variable: "--font-family-serif",
//   display: "swap",
//   preload: true,
// });
//
// Usage on <html>: className={`... ${sans.variable} ${serif.variable}`}
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
	),
	title: {
		default: "Site",
		template: "%s | Site",
	},
};

/**
 * Tiny blocking inline script — runs synchronously before hydration.
 *
 * 1. Adds `js-enabled` to <html> so CSS can safely start images at opacity:0.
 * 2. Wires up the lazy-image fade-in: when an img[data-lazy] finishes loading,
 *    adds `.img-loaded` → CSS transition kicks in (0.2 s ease-in-out).
 * 3. MutationObserver covers images injected after initial paint (client nav).
 *
 * Without JS the images remain fully visible (no opacity applied) — graceful degradation.
 */
const lazyFadeScript = `(function(){
  document.documentElement.classList.add('js-enabled');
  function handle(img){
    if(img.complete&&img.naturalWidth>0){img.classList.add('img-loaded');}
    else{
      img.addEventListener('load',function(){img.classList.add('img-loaded');},{once:true});
      img.addEventListener('error',function(){img.classList.add('img-loaded');},{once:true});
    }
  }
  function scan(){document.querySelectorAll('img[data-lazy]').forEach(handle);}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',scan);}
  else{scan();}
  new MutationObserver(function(recs){
    recs.forEach(function(r){
      r.addedNodes.forEach(function(n){
        if(n.nodeType!==1)return;
        if(n.matches&&n.matches('img[data-lazy]'))handle(n);
        n.querySelectorAll&&n.querySelectorAll('img[data-lazy]').forEach(handle);
      });
    });
  }).observe(document.documentElement,{childList:true,subtree:true});
})();`;

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const h = await headers();
	const rawLocale = h.get(LOCALE_HEADER_NAME) ?? defaultLocale;
	const locale = isAppLocale(rawLocale) ? rawLocale : defaultLocale;
	const siteNav = await fetchSiteNavMenus();
	const draft = await draftMode();

	return (
		<html
			lang={locale}
			// Add font variables here once next/font/local is wired up:
			// className={`h-full antialiased ${sans.variable} ${serif.variable}`}
			className="h-full antialiased"
			suppressHydrationWarning
		>
			<head>
				{/* Lazy-image fade-in + js-enabled flag — must run before first paint */}
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: controlled inline script, no user input */}
				<script dangerouslySetInnerHTML={{ __html: lazyFadeScript }} />

				{/* ── Resource Hints ─────────────────────────────────────────────────── */}
				{/* Sanity image CDN — used by every MediaImage */}
				<link rel="preconnect" href="https://cdn.sanity.io" />
				<link rel="dns-prefetch" href="https://cdn.sanity.io" />

				{/* Mux video player & thumbnails */}
				<link rel="preconnect" href="https://stream.mux.com" />
				<link rel="dns-prefetch" href="https://stream.mux.com" />
				<link rel="dns-prefetch" href="https://image.mux.com" />

				{/* Font preloads are emitted automatically by next/font/local — nothing to add here. */}
			</head>
			<body className="min-h-full flex flex-col bg-color-bg text-color-text font-text">
				<LanguageProvider locale={locale}>
					<Header mainMenu={siteNav?.mainMenu} siteTitle={siteNav?.title} />
					<div className="flex min-h-0 flex-1 flex-col">{children}</div>
					<Footer locale={locale} footerMenu={siteNav?.footerMenu} />
				</LanguageProvider>
				<SanityLive />
				{draft.isEnabled ? (
					<>
						<VisualEditing />
						<DisableDraftMode />
					</>
				) : null}
			</body>
		</html>
	);
}
