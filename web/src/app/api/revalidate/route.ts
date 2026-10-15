import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

import { tagsForWebhookDocument } from "@/sanity/cacheTags";

const REVALIDATE_SECRET = process.env.SANITY_REVALIDATE_SECRET?.trim();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** The webhook projection (`{_id, _type, slug, language}`); fields are checked, not trusted. */
type WebhookPayload = {
	_type?: unknown;
	slug?: { current?: unknown } | null;
	language?: unknown;
};

export async function POST(request: NextRequest) {
	if (!REVALIDATE_SECRET && IS_PRODUCTION) {
		return NextResponse.json(
			{ message: "SANITY_REVALIDATE_SECRET is not configured" },
			{ status: 500 },
		);
	}

	let body: WebhookPayload | null;
	try {
		if (REVALIDATE_SECRET) {
			/* Verifies Sanity's `sanity-webhook-signature` (base64url HMAC over `t.<body>`) and
			 * waits out Content Lake's eventual consistency, so the re-render reads the new data. */
			const parsed = await parseBody<WebhookPayload>(
				request,
				REVALIDATE_SECRET,
			);
			if (parsed.isValidSignature !== true) {
				return NextResponse.json(
					{ message: "Invalid signature" },
					{ status: 401 },
				);
			}
			body = parsed.body;
		} else {
			console.warn(
				"[api/revalidate] SANITY_REVALIDATE_SECRET is not set — accepting an unsigned request outside production.",
			);
			body = await request.json();
		}
	} catch {
		return NextResponse.json(
			{ message: "Error parsing request body" },
			{ status: 400 },
		);
	}

	const type = typeof body?._type === "string" ? body._type : undefined;
	const slug =
		typeof body?.slug?.current === "string" ? body.slug.current : undefined;
	const language =
		typeof body?.language === "string" && body.language.trim()
			? body.language.trim()
			: undefined;

	/* The allow-list lives in `cacheTags.ts`: an unknown `_type` yields no tags, so a forged
	 * payload cannot force cache churn. */
	const tags = tagsForWebhookDocument(type, slug, language);
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
