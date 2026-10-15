import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { draftMode } from "next/headers";
import { stegaClean } from "next-sanity";
import type { ReactNode } from "react";
import { SanityLive } from "@/sanity/live";
import { siteFaviconIcons } from "@/sanity/seo/siteFaviconIcons";
import type { SiteFavicon } from "@/sanity/types";
import { LazyDraftModeOverlays } from "@/src/components/sanity/LazyDraftModeOverlays";
import { handleSanityLiveError } from "@/src/components/sanity/SanityLiveWithErrors";
import { ThemeSync } from "@/src/components/theme/ThemeSync";
import { SITE_BASE_URL } from "@/src/utils/siteUrl";
import "../../assets/styles/tokens.css";
import "../../assets/styles/globals.css";

/**
 * Body + headings — see `typography/fonts.css` (`--font-family-text` / `--font-family-headline`).
 *
 * `display: "swap"` paints text immediately in the metrics-adjusted fallback that
 * `next/font` generates (`adjustFontFallback`), so first paint isn't held for up
 * to 3s of invisible text (`block`) and the swap itself causes no layout shift.
 */
const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-family-sans",
	display: "swap",
});

/** Tags, buttons, inline code — `font-mono` utilities. */
const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-family-mono",
	display: "swap",
});

/** `next/font` class names for `<html>` — also used by `app/not-found.tsx`, which has no shell. */
export const documentFontClassName = `${geistSans.variable} ${geistMono.variable}`;

/**
 * Document-level metadata, merged into `app/[locale]/layout.tsx`'s `generateMetadata`
 * (the root layout). Tab titles come from there (`siteSettings.title` + template).
 *
 * The icons come from `siteSettings.favicon`, with every size derived from that
 * one asset on the Sanity CDN (`siteFaviconIcons`). Declaring them here covers
 * every route below — route metadata merges field by field, so no page has to
 * repeat them. There is deliberately no static fallback: browsers, bookmarks
 * and search crawlers probe `/favicon.ico` regardless of the `<link>` tags, so
 * a static icon would show up beside or instead of the Sanity one. With the
 * field unset the site has no favicon.
 */
export function documentMetadata(
	favicon: SiteFavicon | null | undefined,
): Metadata {
	const icons = siteFaviconIcons(stegaClean(favicon));
	return {
		metadataBase: new URL(SITE_BASE_URL),
		...(icons ? { icons } : {}),
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
 * The lazy-image `img-loaded` class is not set here: `MediaImage` adds it in
 * `useEffect`, so SSR and the first client render agree (a pre-hydration
 * script would race React's streaming hydration on cached images).
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

type Props = {
	/** BCP-47 tag for `<html lang>` — the route's locale. */
	lang: string;
	children: ReactNode;
};

/**
 * The `<html>` / `<body>` document for the root layout, `app/[locale]/layout.tsx`.
 *
 * The root layout sits on the dynamic `[locale]` segment because that is the only way the
 * route's language reaches the server-rendered `<html lang>`: `params` never reach a layout
 * above the segment, and reading the proxy's locale header would opt every route out of
 * static rendering.
 *
 * The cost: `app/not-found.tsx` (a URL that matched no route, so no locale) gets no root
 * layout. It imports the stylesheets and font classes itself and must NOT render this
 * component, which would nest a second `<html>` inside Next's built-in shell.
 *
 * Avoid `headers()` here (keeps static routes static). `draftMode()` only toggles Visual
 * Editing UI.
 */
export async function DocumentShell({ lang, children }: Props) {
	const draft = await draftMode();
	const isDraft = draft.isEnabled;
	const hasRevalidateWebhook = Boolean(
		process.env.SANITY_REVALIDATE_SECRET?.trim(),
	);
	/**
	 * <SanityLive /> opens an SSE connection per open tab and refreshes the `sanityFetch` cache
	 * through a server action on every publish event — needed for Presentation / Draft Mode.
	 * With the revalidate webhook configured, anonymous visitors don't need it: `/api/revalidate`
	 * expires the cache tags the `sanityFetch` wrappers attach. Without the webhook it runs for
	 * everyone (no token needed for published content), so a deploy with neither webhook nor
	 * read token still picks up publishes. (Env is read at render time — the prerender needs the
	 * secret at build.)
	 */
	const shouldMountSanityLive = isDraft || !hasRevalidateWebhook;

	return (
		<html
			lang={lang}
			className={`h-full antialiased ${documentFontClassName}`}
			suppressHydrationWarning
		>
			{/* biome-ignore lint/style/noHeadElement: this is the App Router root layout's document head; the rule targets `next/head` in the pages router and only fires because the shell lives outside `app/` */}
			<head>
				{/* Theme class + lazy-image fade-in — must run before first paint */}
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: controlled inline script, no user input */}
				<script dangerouslySetInnerHTML={{ __html: bootScript }} />

				{/* ── Resource Hints ─────────────────────────────────────────────────── */}
				{/* Sanity image CDN — used by every MediaImage */}
				<link rel="preconnect" href="https://cdn.sanity.io" />
				<link rel="dns-prefetch" href="https://cdn.sanity.io" />

				{/* Mux hints come from the video components (`preconnectMux`), only where a video renders */}

				{/* Font preloads are emitted automatically by next/font/google */}
			</head>
			<body className="min-h-full flex flex-col bg-color-bg text-color-text font-text">
				<ThemeSync />
				{children}
				{shouldMountSanityLive ? (
					<SanityLive onError={handleSanityLiveError} />
				) : null}
				{isDraft ? <LazyDraftModeOverlays /> : null}
			</body>
		</html>
	);
}
