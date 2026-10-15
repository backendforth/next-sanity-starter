import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { stegaClean } from "next-sanity";
import type { ReactNode } from "react";
import { hasRevalidateWebhook } from "@/sanity/cacheTags";
import { SanityLive } from "@/sanity/live";
import { siteFaviconIcons } from "@/sanity/seo/siteFaviconIcons";
import type { SiteFavicon } from "@/sanity/types";
import { documentFontClassName } from "@/src/components/layout/documentFonts";
import { LazyDraftModeOverlays } from "@/src/components/sanity/LazyDraftModeOverlays";
import { handleSanityLiveError } from "@/src/components/sanity/SanityLiveWithErrors";
import { applyBootState } from "@/src/components/theme/colorScheme";
import { ThemeSync } from "@/src/components/theme/ThemeSync";
import { SITE_BASE_URL } from "@/src/utils/siteUrl";
import "../../assets/styles/tokens.css";
import "../../assets/styles/globals.css";

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
 * Tiny blocking inline script, run before the first paint: `applyBootState` sets the stored
 * theme (`data-theme`) and `js-enabled` on <html>. Without JS `<html>` carries neither, so the
 * light `:root` tokens apply and images stay fully visible.
 */
const bootScript = `(${applyBootState})();`;

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
	/**
	 * <SanityLive /> opens an SSE connection per open tab and refreshes the `sanityFetch` cache
	 * through a server action on every publish event — needed for Presentation / Draft Mode.
	 * With the revalidate webhook configured, anonymous visitors don't need it: `/api/revalidate`
	 * expires the cache tags the `sanityFetch` wrappers attach. Without the webhook it runs for
	 * everyone (no token needed for published content), so a deploy with neither webhook nor
	 * read token still picks up publishes. (The prerender needs the secret at build.)
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
			{/* Font, colour and background come from the base `body` rule in `globals.css`. */}
			<body className="min-h-full flex flex-col">
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
