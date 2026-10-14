import type { Metadata } from "next";
import { notFound } from "next/navigation";

/** Same tab title as an unknown `[slug]`. */
export const metadata: Metadata = { title: "Not found" };

/**
 * Deeper paths under a valid locale that match no route (`/de/a/b/c`, `/de/work/a/b`). Without
 * this catch-all Next falls back to the layout-less root `not-found.tsx`, whose `<html>` cannot
 * carry the URL's language. Raising `notFound()` here renders `[locale]/not-found.tsx` inside
 * `DocumentShell` instead — `lang` from the route, header and footer included.
 */
export default function UnmatchedLocalePath(): never {
	notFound();
}
