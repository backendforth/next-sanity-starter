import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
// import localFont from "next/font/local";
import { SanityLive } from "@/sanity/live";
import { DisableDraftMode } from "@/src/components/sanity/DisableDraftMode";
import { ThemeProvider } from "@/src/contexts/ThemeContext";
import { FALLBACK_SITE_LOCALE_CONFIG } from "@/src/i18n/fallbackSiteLocales";
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
//   - "block"    → up to ~3 s invisible text (FOIT), then fallback, swap to
//                  custom font when it arrives. No FOUT, no fallback flash.
//                  With preload + same-origin WOFF2 the invisible window is
//                  typically <200 ms and not perceivable. Recommended default.
//   - "auto"     → browser decides; Chrome / Firefox / Safari currently behave
//                  like "block" but the spec leaves room. Use "block" for
//                  deterministic behavior.
//   - "swap"     → ~100 ms block, then fallback, swap to custom font when ready.
//                  Always shows the custom font on the first visit but causes a
//                  visible fallback → custom font flash (FOUT) and CLS.
//   - "optional" → ~100 ms block, then fallback for the WHOLE page session if
//                  the font is not ready. Font is fetched in the background and
//                  cached for subsequent visits. Zero CLS, but on a cold cache
//                  the custom font typically only shows starting from the
//                  second page load — even with preload.
//   - "fallback" → 100 ms block + 3 s swap window, then locks fallback for the
//                  rest of the session. Middle ground.
//
// To keep the FOIT window short with "block":
//   - Subset the font to the glyphs you actually use (Latin / Latin-Ext).
//   - Prefer a variable font (1 file covers all weights → 1 preload).
//   - Only set `preload: true` for above-the-fold weights; italic / display
//     cuts that are not in the first viewport should use `preload: false`.
//   - `adjustFontFallback` (default true for next/font) auto-generates a
//     metrics-matched fallback to minimize the swap CLS if the 3 s elapse.
//
// const sans = localFont({
//   src: [
//     { path: "../../assets/fonts/YourSans-Regular.woff2", weight: "400", style: "normal" },
//     { path: "../../assets/fonts/YourSans-Bold.woff2",    weight: "700", style: "normal" },
//   ],
//   variable: "--font-family-sans",
//   display: "block",
//   preload: true,    // emits <link rel="preload"> for the first weight in `src`
// });
//
// const serif = localFont({
//   src: "../../assets/fonts/YourSerif-Regular.woff2",
//   variable: "--font-family-serif",
//   display: "block",
//   preload: false,   // serif headlines are usually not above-the-fold
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
 * 1. Applies the stored theme override (`localStorage["color-scheme"]`) as
 *    `data-theme="light" | "dark"` on <html> **before** the first paint. For
 *    `"system"` or a missing value the attribute stays unset, so the
 *    `@media (prefers-color-scheme: dark)` rule in `variables/colors.css`
 *    takes over — works without JavaScript.
 * 2. Adds `js-enabled` to <html> so CSS can safely start images at opacity:0.
 * 3. Wires up the lazy-image fade-in: when an img[data-lazy] finishes loading,
 *    adds `.img-loaded` → CSS transition kicks in (0.2 s ease-in-out).
 * 4. MutationObserver covers images injected after initial paint (client nav).
 *
 * Without JS the images remain fully visible (no opacity applied) — graceful degradation.
 */
const bootScript = `(function(){
  try{
    var t=localStorage.getItem('color-scheme');
    if(t==='light'||t==='dark'){
      document.documentElement.setAttribute('data-theme',t);
    }
  }catch(e){}
  document.documentElement.classList.add('js-enabled');
  function handle(img){
    function add(){img.classList.add('img-loaded');}
    /* Defer the className mutation past the current task so React 19 streaming
       hydration reconciles the SSR markup before we touch it — otherwise images
       served from cache produce a "tree hydrated but attributes didn't match"
       warning (className diff: 'img-loaded' was added by this script). */
    if(img.complete&&img.naturalWidth>0){requestAnimationFrame(add);}
    else{
      img.addEventListener('load',add,{once:true});
      img.addEventListener('error',add,{once:true});
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

/**
 * Root shell only — avoid `headers()` here (keeps static routes static where possible).
 * `draftMode()` only toggles Visual Editing UI; locale chrome lives in `app/[locale]/layout.tsx`.
 * `lang` defaults to the site default; `LanguageProvider` syncs `<html lang>` on the client after navigation.
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

	return (
		<html
			lang={FALLBACK_SITE_LOCALE_CONFIG.defaultLocale}
			// Add font variables here once next/font/local is wired up:
			// className={`h-full antialiased ${sans.variable} ${serif.variable}`}
			className="h-full antialiased"
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

				{/* Font preloads are emitted automatically by next/font/local — nothing to add here. */}
			</head>
			<body className="min-h-full flex flex-col bg-color-bg text-color-text font-text">
				<ThemeProvider>{children}</ThemeProvider>
				{shouldMountSanityLive ? <SanityLive /> : null}
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
