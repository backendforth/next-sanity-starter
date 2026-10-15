import { Geist, Geist_Mono } from "next/font/google";

/**
 * Body text, big text, RT h1/h2 — the `font-text` stack (`tailwind/theme.css`).
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

/** RT h3/h4, tags, buttons, inline code, bold/italic in body text — the `font-mono` stack. */
const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-family-mono",
	display: "swap",
});

/**
 * `next/font` variable classes for `<html>` (`DocumentShell`). The layout-less `app/not-found.tsx`
 * and `app/global-error.tsx` set them too; this module has no server-only imports, so the client
 * `global-error` can import it.
 */
export const documentFontClassName = `${geistSans.variable} ${geistMono.variable}`;
