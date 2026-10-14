"use client";

import dynamic from "next/dynamic";

/**
 * The content-ref list with its category filter and sort loads only on pages that render a
 * `module.contentRefs`; `ModulesRenderer` imports the module for every page with modules. SSR
 * stays on, so the list is in the first paint.
 */
export const LazyModuleContentRefsClient = dynamic(() =>
	import("./ModuleContentRefsClient").then((m) => m.ModuleContentRefsClient),
);
