"use client";

import dynamic from "next/dynamic";

/**
 * Lazy client boundary around `SiteTracking`, like `LazyCookieConsentBanner`: the tracker
 * loaders and the consent wiring render nothing on the server and only act in effects, so the
 * chunk can wait until after hydration. The layout mounts this only when a tracker is enabled.
 */
export const LazySiteTracking = dynamic(
	() => import("./SiteTracking").then((m) => m.SiteTracking),
	{ ssr: false },
);
