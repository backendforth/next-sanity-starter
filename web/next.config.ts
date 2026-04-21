import type { NextConfig } from "next";

// App Router: no `next.config` i18n (unsupported; can redirect to `/de` etc.). Default language is English.
const nextConfig: NextConfig = {
	transpilePackages: ["@repo/languages", "@repo/sanity-dataset-resolve"],

	/**
	 * Tree-shake heavy packages at build time.
	 * Next.js rewrites barrel-file imports (e.g. `import { X } from "@portabletext/react"`)
	 * to direct module paths, eliminating unused exports from the client bundle.
	 */
	experimental: {
		optimizePackageImports: ["@portabletext/react", "clsx", "tailwind-merge"],
	},

	images: {
		qualities: [75, 85],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.sanity.io",
			},
			{
				protocol: "https",
				hostname: "image.mux.com",
			},
		],
	},
};

export default nextConfig;
