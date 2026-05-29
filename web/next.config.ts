import type { NextConfig } from "next";

// App Router: no `next.config` i18n. Site locales come from Sanity (`siteLanguageSettings`), not from here.
// Use the same `SANITY_STUDIO_PROJECT_ID` / dataset env as `studio/.env` so web + Studio hit one dataset.
const nextConfig: NextConfig = {
	transpilePackages: ["@repo/sanity-dataset-resolve"],

	/**
	 * Inline `SANITY_STUDIO_*` into the **client** bundle.
	 *
	 * Next normally only exposes `NEXT_PUBLIC_*` variables to the browser. We keep a single
	 * env-var name across `web/` and `studio/` (`SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`)
	 * by listing them here — `next.config`'s `env` map gets statically replaced at build time
	 * exactly like `NEXT_PUBLIC_*`. Without this, Client Components (image-URL builder etc.)
	 * would see `undefined` and SSR / CSR would diverge → hydration mismatch on Sanity images.
	 */
	env: {
		SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID ?? "",
		SANITY_STUDIO_DATASET: process.env.SANITY_STUDIO_DATASET ?? "",
	},

	/** Drop the `X-Powered-By: Next.js` header — small fingerprinting reduction. */
	poweredByHeader: false,

	/** Default in Next 16; pinned explicitly to make the starter's choice obvious. */
	reactStrictMode: true,

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
