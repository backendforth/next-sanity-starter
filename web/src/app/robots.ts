import type { MetadataRoute } from "next";

const BASE_URL = (
	process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
).replace(/\/$/, "");

/**
 * Production-only crawling. Deploy previews and staging environments are
 * blanket-disallowed so they don't pollute search results with duplicate
 * content. Detection covers Vercel, Netlify, and the explicit Sanity
 * deployment-target convention used by this starter.
 */
function isProductionDeployment(): boolean {
	if (process.env.SANITY_STUDIO_DEPLOYMENT_TARGET === "production") return true;
	if (process.env.VERCEL_ENV === "production") return true;
	if (process.env.NETLIFY === "true" && process.env.CONTEXT === "production") {
		return true;
	}
	return false;
}

export default function robots(): MetadataRoute.Robots {
	if (!isProductionDeployment()) {
		return {
			rules: { userAgent: "*", disallow: "/" },
		};
	}
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/api/"],
		},
		sitemap: `${BASE_URL}/sitemap.xml`,
	};
}
