import { defineLive } from "next-sanity/live";

import { client } from "./client";
import { readToken } from "./readToken";

/** `false` without a token silences next-sanity's warnings (local dev without preview). */
const token = readToken || false;

export const { sanityFetch, SanityLive } = defineLive({
	client,
	serverToken: token,
	browserToken: token,
});
