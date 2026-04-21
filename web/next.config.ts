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
		optimizePackageImports: [
			"@portabletext/react",
			"clsx",
			"tailwind-merge",
			"@sanity/image-url",
		],
		/** Client router cache for prefetched static segments (seconds). */
		staleTimes: {
			static: 180,
			dynamic: 30,
		},
	},

	compiler: {
		removeConsole:
			process.env.NODE_ENV === "production"
				? { exclude: ["error", "warn"] }
				: false,
	},

	images: {
		formats: ["image/avif", "image/webp"],
		qualities: [75, 85],
		/** Layout breakpoints live in CSS (`variables/breakpoints.css`). Next defaults for `deviceSizes` / `imageSizes` are fine for the few `next/image` uses. */
		minimumCacheTTL: 60 * 60 * 24 * 30,
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
