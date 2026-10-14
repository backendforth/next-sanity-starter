"use client";

import dynamic from "next/dynamic";

/** Tracker loaders and consent wiring act only in effects, so the chunk waits for hydration. */
export const LazySiteTracking = dynamic(
	() => import("./SiteTracking").then((m) => m.SiteTracking),
	{ ssr: false },
);
