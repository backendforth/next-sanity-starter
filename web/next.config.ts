import type { NextConfig } from "next";

// App Router: no `next.config` i18n (unsupported; can redirect to `/de` etc.). Default language is English.
const nextConfig: NextConfig = {
	transpilePackages: ["@repo/languages"],
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
