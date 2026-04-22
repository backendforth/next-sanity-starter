import { defineLive } from "next-sanity/live";

import { client } from "./client";

const readToken = process.env.SANITY_API_READ_TOKEN?.trim();
const liveToken =
	readToken && readToken.length > 0 ? readToken : (false as const);

export const { sanityFetch, SanityLive } = defineLive({
	client: client.withConfig({ apiVersion: "2024-01-01" }),
	/** `false` silences next-sanity warnings when no token is configured (local dev without preview). */
	serverToken: liveToken,
	browserToken: liveToken,
});
