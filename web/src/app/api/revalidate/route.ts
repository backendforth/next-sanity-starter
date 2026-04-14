import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const REVALIDATE_SECRET = process.env.SANITY_REVALIDATE_SECRET;

type SanityWebhookPayload = {
	_id?: string;
	_type?: string;
	slug?: { current?: string } | null;
};

function getTagsForDocument(payload: SanityWebhookPayload): string[] {
	const tags: string[] = [];
	const { _type, slug } = payload;

	if (_type === "home") {
		tags.push("home");
	}

	if (_type === "page") {
		tags.push("pages");
		if (slug?.current) {
			tags.push(`page-${slug.current}`);
		}
	}

	if (_type === "siteSettings" || _type === "errorSettings") {
		tags.push("settings");
	}

	return tags;
}

export async function POST(request: NextRequest) {
	const secret = request.nextUrl.searchParams.get("secret");

	if (REVALIDATE_SECRET && secret !== REVALIDATE_SECRET) {
		return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as SanityWebhookPayload;
		const tags = getTagsForDocument(body);

		if (tags.length === 0) {
			return NextResponse.json({
				revalidated: false,
				message: "No matching tags for document type",
			});
		}

		for (const tag of tags) {
			revalidateTag(tag);
		}

		return NextResponse.json({
			revalidated: true,
			tags,
		});
	} catch {
		return NextResponse.json(
			{ message: "Error parsing request body" },
			{ status: 400 },
		);
	}
}
