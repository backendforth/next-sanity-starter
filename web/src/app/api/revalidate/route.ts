import { createHmac, timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const REVALIDATE_SECRET = process.env.SANITY_REVALIDATE_SECRET?.trim();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Allow-list of `_type` values the webhook is permitted to invalidate. Anything
 * else returns `200 { revalidated: false }` so an attacker cannot DoS Sanity by
 * forging unknown payloads.
 */
const ALLOWED_DOCUMENT_TYPES = new Set([
	"home",
	"work",
	"page",
	"project",
	"siteSettings",
	"errorSettings",
	"siteLanguageSettings",
] as const);

type SanityWebhookPayload = {
	_id?: string;
	_type?: string;
	slug?: { current?: string } | null;
};

// ── Defense-in-depth: simple in-memory token bucket per IP ───────────────────
//
// Serverless instances are short-lived; this is best-effort and only protects
// a single warm function from burst floods. Pair with platform-level rate
// limiting for production-grade protection.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const bucket = rateBuckets.get(ip);
	if (!bucket || bucket.resetAt < now) {
		rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return false;
	}
	bucket.count += 1;
	return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

function clientIpFrom(request: NextRequest): string {
	const xff = request.headers.get("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}
	return request.headers.get("x-real-ip") ?? "unknown";
}

function isValidPayload(value: unknown): value is SanityWebhookPayload {
	if (!value || typeof value !== "object") return false;
	const v = value as Record<string, unknown>;
	if (v._id !== undefined && typeof v._id !== "string") return false;
	if (v._type !== undefined && typeof v._type !== "string") return false;
	if (v.slug !== undefined && v.slug !== null) {
		if (typeof v.slug !== "object") return false;
		const slugCurrent = (v.slug as { current?: unknown }).current;
		if (slugCurrent !== undefined && typeof slugCurrent !== "string") {
			return false;
		}
	}
	return true;
}

/**
 * Constant-time HMAC verification compatible with the Sanity GROQ-powered
 * webhook header (`sanity-webhook-signature: t=<timestamp>,v1=<hex>`).
 * Falls back to a raw hex comparison so generic webhooks (e.g. `crypto.createHmac`
 * driven by a CI script) still work.
 */
function verifySignature(
	rawBody: string,
	signatureHeader: string | null,
	secret: string,
): boolean {
	if (!signatureHeader) return false;

	const parts = signatureHeader
		.split(",")
		.reduce<Record<string, string>>((acc, part) => {
			const [key, value] = part.split("=");
			if (key && value) acc[key.trim()] = value.trim();
			return acc;
		}, {});

	const provided = parts.v1 ?? signatureHeader.trim();
	const timestamp = parts.t;
	const payloadToSign = timestamp ? `${timestamp}.${rawBody}` : rawBody;

	const computed = createHmac("sha256", secret)
		.update(payloadToSign)
		.digest("hex");

	const a = Buffer.from(computed, "hex");
	const b = Buffer.from(provided, "hex");
	if (a.length === 0 || a.length !== b.length) return false;
	try {
		return timingSafeEqual(a, b);
	} catch {
		return false;
	}
}

function getTagsForDocument(payload: SanityWebhookPayload): string[] {
	const tags: string[] = [];
	const { _type, slug } = payload;

	if (_type && !ALLOWED_DOCUMENT_TYPES.has(_type as never)) {
		return tags;
	}

	if (_type === "home") {
		tags.push("home", "site-pages");
	}

	if (_type === "work") {
		tags.push("work", "site-pages");
	}

	if (_type === "page") {
		tags.push("pages", "site-pages");
		if (slug?.current) {
			tags.push(`page-${slug.current}`);
		}
	}

	if (_type === "project") {
		tags.push("projects", "site-pages");
		if (slug?.current) {
			tags.push(`project-${slug.current}`);
		}
	}

	// siteSettings, errorSettings and siteNav are read via `sanityFetch` (live).
	// next-sanity handles their invalidation through its own sync tags, so there
	// is no manual `unstable_cache` tag to invalidate here.

	if (_type === "siteLanguageSettings") {
		tags.push("site-language-settings");
	}

	return tags;
}

export async function POST(request: NextRequest) {
	if (!REVALIDATE_SECRET) {
		if (IS_PRODUCTION) {
			return NextResponse.json(
				{
					message:
						"SANITY_REVALIDATE_SECRET is not configured. Refusing to process webhook in production.",
				},
				{ status: 500 },
			);
		}
		console.error(
			"[api/revalidate] SANITY_REVALIDATE_SECRET is not set — accepting unsigned requests in non-production only.",
		);
	}

	const ip = clientIpFrom(request);
	if (isRateLimited(ip)) {
		return NextResponse.json({ message: "Too many requests" }, { status: 429 });
	}

	const rawBody = await request.text();

	if (REVALIDATE_SECRET) {
		const signatureHeader =
			request.headers.get("sanity-webhook-signature") ??
			request.headers.get("x-sanity-signature");

		if (!verifySignature(rawBody, signatureHeader, REVALIDATE_SECRET)) {
			return NextResponse.json(
				{ message: "Invalid signature" },
				{ status: 401 },
			);
		}
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(rawBody);
	} catch {
		return NextResponse.json(
			{ message: "Error parsing request body" },
			{ status: 400 },
		);
	}

	if (!isValidPayload(parsed)) {
		return NextResponse.json(
			{ message: "Invalid payload shape" },
			{ status: 400 },
		);
	}

	const tags = getTagsForDocument(parsed);
	if (tags.length === 0) {
		return NextResponse.json({
			revalidated: false,
			message: "No matching tags for document type",
		});
	}

	for (const tag of tags) {
		revalidateTag(tag, {});
	}

	return NextResponse.json({
		revalidated: true,
		tags,
	});
}
