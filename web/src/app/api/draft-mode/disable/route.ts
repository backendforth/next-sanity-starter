import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Returns the user to wherever the editor was when they clicked "Disable Draft Mode".
 * Only same-origin pathnames are honored — anything else falls back to "/".
 */
function safeRedirectTarget(rawTarget: string | null, requestUrl: URL): URL {
	const fallback = new URL("/", requestUrl);
	if (!rawTarget) return fallback;

	try {
		const candidate = new URL(rawTarget, requestUrl);
		if (candidate.origin !== requestUrl.origin) return fallback;
		return candidate;
	} catch {
		return fallback;
	}
}

export async function GET(request: Request) {
	(await draftMode()).disable();
	const requestUrl = new URL(request.url);
	const target = safeRedirectTarget(
		requestUrl.searchParams.get("redirect"),
		requestUrl,
	);
	return NextResponse.redirect(target);
}
