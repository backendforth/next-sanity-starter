"use client";

import dynamic from "next/dynamic";

/** The project list's filter and sort controls, only on pages that render one. SSR on. */
export const LazyModuleContentRefsClient = dynamic(() =>
	import("./ModuleContentRefsClient").then((m) => m.ModuleContentRefsClient),
);
