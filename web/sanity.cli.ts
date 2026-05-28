import { defineCliConfig } from "sanity/cli";

/**
 * Minimal CLI config so `sanity typegen generate` recognizes `web/` as a
 * project root. Typegen reads the local schema (`../studio/schema.json` via
 * `sanity-typegen.json`) and the `defineQuery` usages in `./sanity/**` — it
 * never calls the Sanity API, so a placeholder project id is fine here.
 * This file is read only by the Sanity CLI; Next.js ignores it.
 */
export default defineCliConfig({
	api: {
		projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "placeholder",
		dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
	},
});
