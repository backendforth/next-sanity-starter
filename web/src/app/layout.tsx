import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
// import localFont from "next/font/local";
import {
	fetchSiteLanguageSettings,
	fetchSiteSettingsFavicon,
} from "@/sanity/fetchSanityData";
import { SanityLive } from "@/sanity/live";
import { DisableDraftMode } from "@/src/components/sanity/DisableDraftMode";
import { handleSanityLiveError } from "@/src/components/sanity/SanityLiveWithErrors";
import { DocumentBootScript } from "@/src/components/theme/DocumentBootScript";
import { ThemeProvider } from "@/src/contexts/ThemeContext";
import "../assets/styles/tokens.css";
import "../assets/styles/globals.css";

// ── Fonts ─────────────────────────────────────────────────────────────────────
//
// next/font/local handles subsetting, preload, and font-face injection
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
// `display` trade-offs (CSS Fonts spec):
//   - "swap"     → ~100 ms block, then fallback, swap to custom font when ready.
//                  Always shows the custom font on the first visit. `next/font`
//                  generates a metrics-matched fallback (`adjustFontFallback`,
//                  on by default), so the swap costs no layout shift and text
//                  paints straight away. Recommended default.
//   - "block"    → up to ~3 s invisible text (FOIT), then fallback, swap to
//                  custom font when it arrives. No FOUT, no fallback flash.
//                  With preload + same-origin WOFF2 the invisible window is
//                  often <200 ms — but it is a real hold on first paint, and on
//                  a cold cache or slow link it is very perceivable. `main` ran
//                  "block" and moved off it for exactly that reason (a5d9827).
//   - "auto"     → browser decides; Chrome / Firefox / Safari currently behave
//                  like "block" but the spec leaves room. Set an explicit value
//                  for deterministic behavior.
//   - "optional" → ~100 ms block, then fallback for the WHOLE page session if
//                  the font is not ready. Font is fetched in the background and
//                  cached for subsequent visits. Zero CLS, but on a cold cache
//                  the custom font typically only shows starting from the
//                  second page load — even with preload.
//   - "fallback" → 100 ms block + 3 s swap window, then locks fallback for the
//                  rest of the session. Middle ground.
//
// To keep the fallback→custom swap unnoticeable with "swap":
//   - Subset the font to the glyphs you actually use (Latin / Latin-Ext).
//   - Prefer a variable font (1 file covers all weights → 1 preload).
//   - Only set `preload: true` for above-the-fold weights; italic / display
//     cuts that are not in the first viewport should use `preload: false`.
//   - Leave `adjustFontFallback` on (the next/font default) — it generates the
//     metrics-matched fallback that makes the swap cost no layout shift.
//
// const sans = localFont({
//   src: [
//     { path: "../../assets/fonts/YourSans-Regular.woff2", weight: "400", style: "normal" },
//     { path: "../../assets/fonts/YourSans-Bold.woff2",    weight: "700", style: "normal" },
//   ],
//   variable: "--font-family-sans",
//   display: "swap",
//   preload: true,    // emits <link rel="preload"> for the first weight in `src`
// });
//
// const serif = localFont({
//   src: "../../assets/fonts/YourSerif-Regular.woff2",
//   variable: "--font-family-serif",
//   display: "swap",
//   preload: false,   // serif headlines are usually not above-the-fold
// });
//
// Usage on <html>: className={`... ${sans.variable} ${serif.variable}`}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Root shell metadata. The tab title (`siteSettings.title` + `%s | …` template)
 * is owned by `app/[locale]/layout.tsx`; the favicon comes from
 * `siteSettings.favicon` for the default locale, with the static
 * `app/favicon.ico` as the fallback when unset (Next emits it automatically).
 */
export async function generateMetadata(): Promise<Metadata> {
	const siteLocale = await fetchSiteLanguageSettings();
	const faviconUrl = await fetchSiteSettingsFavicon(siteLocale.defaultLocale, {
		stega: false,
	});
	return {
		metadataBase: new URL(
			process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
		),
		...(faviconUrl ? { icons: { icon: faviconUrl } } : {}),
	};
}

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
			// Add font variables here once next/font/local is wired up:
			// className={`h-full antialiased ${sans.variable} ${serif.variable}`}
			className="h-full antialiased"
			suppressHydrationWarning
		>
			<head>
				{/* ── Resource Hints ─────────────────────────────────────────────────── */}
				{/* Sanity image CDN — used by every MediaImage */}
				<link rel="preconnect" href="https://cdn.sanity.io" />
				<link rel="dns-prefetch" href="https://cdn.sanity.io" />

				{/* Mux video player & thumbnails */}
				<link rel="preconnect" href="https://stream.mux.com" />
				<link rel="dns-prefetch" href="https://stream.mux.com" />
				<link rel="preconnect" href="https://image.mux.com" />
				<link rel="dns-prefetch" href="https://image.mux.com" />

				{/* Font preloads are emitted automatically by next/font/local — nothing to add here. */}
			</head>
			<body className="min-h-full flex flex-col bg-color-bg text-color-text font-text">
				{/* Theme + js-enabled — injected in <head> via useServerInsertedHTML */}
				<DocumentBootScript />
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
