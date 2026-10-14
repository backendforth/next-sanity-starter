"use client";

import dynamic from "next/dynamic";

/** The content-ref list with filter and sort, only on pages that render one. SSR on. */
export const LazyModuleContentRefsClient = dynamic(() =>
	import("./ModuleContentRefsClient").then((m) => m.ModuleContentRefsClient),
);
