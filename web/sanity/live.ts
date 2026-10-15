import { defineLive } from "next-sanity/live";

import { client } from "./client";

/** `false` without a token silences next-sanity's warnings (local dev without preview). */
const token = process.env.SANITY_API_READ_TOKEN?.trim() || false;

export const { sanityFetch, SanityLive } = defineLive({
	client,
	serverToken: token,
	browserToken: token,
});
