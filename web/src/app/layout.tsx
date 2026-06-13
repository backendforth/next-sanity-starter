import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import {
	fetchSiteLanguageSettings,
	fetchSiteSettingsFavicon,
} from "@/sanity/fetchSanityData";
import { SanityLive } from "@/sanity/live";
import { DisableDraftMode } from "@/src/components/sanity/DisableDraftMode";
import { handleSanityLiveError } from "@/src/components/sanity/SanityLiveWithErrors";
import { ThemeProvider } from "@/src/contexts/ThemeContext";
import "../assets/styles/tokens.css";
import "../assets/styles/globals.css";

/** Body + headings — see `typography/fonts.css` (`--font-family-text` / `--font-family-headline`). */
const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-family-sans",
	display: "block",
});

/** Tags, buttons, inline code — `font-mono` utilities. */
const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-family-mono",
	display: "block",
});

/**
 * Tab titles come from `app/[locale]/layout.tsx` (`siteSettings.title` + template).
 * The favicon comes from `siteSettings.favicon`; the static `app/favicon.ico`
 * remains the fallback when the field is unset (Next emits it automatically).
 */
export async function generateMetadata(): Promise<Metadata> {
	const faviconUrl = await fetchSiteSettingsFavicon({ stega: false });
	return {
		metadataBase: new URL(
			process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
		),
		...(faviconUrl ? { icons: { icon: faviconUrl } } : {}),
	};
}

/**
 * Tiny blocking inline script — runs synchronously before hydration.
 *
 * 1. Applies the stored theme override (`localStorage["color-scheme"]`) as
 *    `data-theme="light" | "dark"` on <html> **before** the first paint.
 *    Without JS, `<html>` carries no attribute and the `:root` light defaults
 *    in `variables/colors.css` apply — OS preference is deliberately ignored.
 * 2. Adds `js-enabled` to <html> so CSS can safely start images at opacity:0.
 *
 * The lazy-image `img-loaded` class is added by `MediaImage` itself via
 * `useEffect` — managing it from this inline script raced React 19 streaming
 * hydration on cached images and produced "tree hydrated but attributes didn't
 * match" warnings. Doing it through React's render flow keeps SSR and the
 * first client paint identical.
 *
 * Without JS the images remain fully visible (no opacity applied) — graceful degradation.
 */
const bootScript = `(function(){
  try{
    var t=localStorage.getItem('color-scheme');
    document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');
  }catch(e){}
  document.documentElement.classList.add('js-enabled');
})();`;

/**
 * Root shell only — avoid `headers()` here (keeps static routes static where possible).
 * `draftMode()` only toggles Visual Editing UI; locale chrome lives in `app/[locale]/layout.tsx`.
 * `lang` is the Sanity site default (`siteLanguageSettings.defaultLanguageId`, deduped via
 * React `cache`); `LanguageProvider` syncs `<html lang>` on the client after navigation.
 */
export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const draft = await draftMode();
	const isDraft = draft.isEnabled;
	const hasReadToken = Boolean(process.env.SANITY_API_READ_TOKEN?.trim());
	const shouldMountSanityLive = hasReadToken || isDraft;
	const siteLocale = await fetchSiteLanguageSettings();

	return (
		<html
			lang={siteLocale.defaultLocale}
			className={`h-full antialiased ${geistSans.variable} ${geistMono.variable}`}
			suppressHydrationWarning
		>
			<head>
				{/* Theme class + lazy-image fade-in — must run before first paint */}
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: controlled inline script, no user input */}
				<script dangerouslySetInnerHTML={{ __html: bootScript }} />

				{/* ── Resource Hints ─────────────────────────────────────────────────── */}
				{/* Sanity image CDN — used by every MediaImage */}
				<link rel="preconnect" href="https://cdn.sanity.io" />
				<link rel="dns-prefetch" href="https://cdn.sanity.io" />

				{/* Mux video player & thumbnails */}
				<link rel="preconnect" href="https://stream.mux.com" />
				<link rel="dns-prefetch" href="https://stream.mux.com" />
				<link rel="preconnect" href="https://image.mux.com" />
				<link rel="dns-prefetch" href="https://image.mux.com" />

				{/* Font preloads are emitted automatically by next/font/google */}
			</head>
			<body className="min-h-full flex flex-col bg-color-bg text-color-text font-text">
				<svg
					aria-hidden="true"
					focusable="false"
					width="0"
					height="0"
					style={{ position: "absolute" }}
				>
					<title>Video sharpen filter</title>
					<filter id="mvl-sharpen" colorInterpolationFilters="sRGB">
						<feConvolveMatrix
							order="3"
							preserveAlpha="true"
							kernelMatrix="0 -0.35 0  -0.35 2.4 -0.35  0 -0.35 0"
						/>
					</filter>
				</svg>
				<ThemeProvider>{children}</ThemeProvider>
				{shouldMountSanityLive ? (
					<SanityLive onError={handleSanityLiveError} />
				) : null}
				{isDraft ? (
					<>
						<VisualEditing />
						<DisableDraftMode />
					</>
				) : null}
			</body>
		</html>
	);
}
