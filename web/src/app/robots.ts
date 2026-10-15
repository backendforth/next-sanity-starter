import { isProductionDeployment } from "@repo/sanity-dataset-resolve";
import type { MetadataRoute } from "next";
import { SITE_BASE_URL } from "@/src/utils/siteUrl";

/**
 * Production-only crawling (`isProductionDeployment`). Deploy previews, branch deploys and any
 * deploy whose `SANITY_STUDIO_DEPLOYMENT_TARGET` is not `production` are blanket-disallowed, so
 * they don't pollute search results with duplicate content — a staging site on a host's
 * production context included.
 */
export default function robots(): MetadataRoute.Robots {
	if (!isProductionDeployment(process.env)) {
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
		sitemap: `${SITE_BASE_URL}/sitemap.xml`,
	};
}
