import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

import { tagsForWebhookDocument } from "@/sanity/cacheTags";

const REVALIDATE_SECRET = process.env.SANITY_REVALIDATE_SECRET?.trim();

/** The webhook projection, `{_type}`. `parseBody` only hands it over signed. */
type WebhookPayload = { _type?: string };

export async function POST(request: NextRequest) {
	if (!REVALIDATE_SECRET) {
		return NextResponse.json(
			{ message: "SANITY_REVALIDATE_SECRET is not configured" },
			{ status: 500 },
		);
	}

	let parsed: Awaited<ReturnType<typeof parseBody<WebhookPayload>>>;
	try {
		/* Verifies Sanity's `sanity-webhook-signature` (base64url HMAC over `t.<body>`) and waits
		 * out Content Lake's eventual consistency, so the re-render reads the new data. */
		parsed = await parseBody<WebhookPayload>(request, REVALIDATE_SECRET);
	} catch {
		return NextResponse.json(
			{ message: "Error parsing request body" },
			{ status: 400 },
		);
	}
	if (parsed.isValidSignature !== true) {
		return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
	}

	/* The allow-list lives in `cacheTags.ts`: an unknown `_type` yields no tags. */
	const tags = tagsForWebhookDocument(parsed.body?._type);
	if (tags.length === 0) {
		return NextResponse.json({
			revalidated: false,
			message: "No matching tags for document type",
		});
	}

	/* `expire: 0` drops the entries now: the next request renders fresh instead of serving the
	 * stale page once more, so editors see a publish on their first reload. */
	for (const tag of tags) {
		revalidateTag(tag, { expire: 0 });
	}

	return NextResponse.json({ revalidated: true, tags });
}
