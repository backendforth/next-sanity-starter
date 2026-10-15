import {
	createImageUrlBuilder,
	type SanityImageSource,
} from "@sanity/image-url";

import { dataset, projectId } from "@/sanity/sanityEnv";

/**
 * What the image helpers read from an `image` field projected with `imageQuery` (or a raw
 * Studio image field). Their input contract, checked at runtime by
 * `resolveSanityImageFieldForUrl`; the query result types themselves come from TypeGen.
 */
type SanityImageAssetRef = {
	_id?: string;
	_ref?: string;
	metadata?: {
		dimensions?: {
			width?: number;
			height?: number;
		} | null;
	} | null;
};

export type SanityImageField = {
	crop?: unknown;
	hotspot?: unknown;
	asset?: SanityImageAssetRef | null;
	alt?: string | null;
} | null;

type ImageFit = "clip" | "crop" | "fill" | "fillmax" | "max" | "scale" | "min";
type ImageAuto = "format";
/** Explicit output format — use instead of `auto` where the consumer cannot content-negotiate (browser icons). */
type ImageFormat = "png" | "jpg" | "webp";

type BuildImageUrlOptions = {
	width?: number;
	height?: number;
	quality?: number;
	fit?: ImageFit;
	auto?: ImageAuto;
	format?: ImageFormat;
	dpr?: 1 | 2 | 3;
};

const builder = createImageUrlBuilder({
	projectId,
	dataset,
});

function assetRefForBuilder(
	asset: SanityImageAssetRef | null | undefined,
): string | null {
	if (!asset || typeof asset !== "object") {
		return null;
	}
	const a = asset as { _id?: string; _ref?: string };
	if (typeof a._id === "string" && a._id.length > 0) {
		return a._id;
	}
	if (typeof a._ref === "string" && a._ref.length > 0) {
		return a._ref;
	}
	return null;
}

function toSanityImageSource(
	image: SanityImageField,
): SanityImageSource | null {
	if (!image) {
		return null;
	}
	const id = assetRefForBuilder(image.asset);
	if (!id) {
		return null;
	}

	return {
		_type: "image" as const,
		asset: { _ref: id, _type: "reference" as const },
		crop: image.crop,
		hotspot: image.hotspot,
	} satisfies SanityImageSource;
}

/**
 * Pixel size of the cropped image area (Studio crop uses 0–1 fractions of the original asset).
 * Matches how `sanity/image-url` interprets `crop` when building URLs.
 */
export function getCroppedImageDisplayDimensions(
	image: SanityImageField,
	fallback: { width: number; height: number } = { width: 1920, height: 1080 },
): { width: number; height: number } {
	const dims = image?.asset?.metadata?.dimensions;
	const ow = typeof dims?.width === "number" ? dims.width : fallback.width;
	const oh = typeof dims?.height === "number" ? dims.height : fallback.height;

	const crop = image?.crop as
		| { top?: number; left?: number; right?: number; bottom?: number }
		| null
		| undefined;
	if (!crop) {
		return { width: Math.round(ow), height: Math.round(oh) };
	}

	const left = crop.left ?? 0;
	const right = crop.right ?? 0;
	const top = crop.top ?? 0;
	const bottom = crop.bottom ?? 0;

	const w = ow - left * ow - right * ow;
	const h = oh - top * oh - bottom * oh;

	const cw = Number.isFinite(w) && w > 0 ? Math.round(w) : Math.round(ow);
	const ch = Number.isFinite(h) && h > 0 ? Math.round(h) : Math.round(oh);
	return { width: cw, height: ch };
}

/**
 * Maps the field's `hotspot` (0–1 from the left / top of the original asset) to CSS
 * `object-position` for `object-fit: cover`. GROQ must project `hotspot`.
 *
 * @see https://www.sanity.io/docs/image-type#hotspot
 */
export function cssObjectPositionFromSanityImageField(
	image: SanityImageField | null | undefined,
): string | undefined {
	const h = image?.hotspot as { x?: number; y?: number } | null | undefined;
	const x = typeof h?.x === "number" && Number.isFinite(h.x) ? h.x : undefined;
	const y = typeof h?.y === "number" && Number.isFinite(h.y) ? h.y : undefined;
	if (x === undefined || y === undefined) {
		return undefined;
	}
	const xp = Math.min(1, Math.max(0, x));
	const yp = Math.min(1, Math.max(0, y));
	return `${xp * 100}% ${yp * 100}%`;
}

export function buildFetchedImageUrl(
	image: SanityImageField,
	options: BuildImageUrlOptions = {},
): string | null {
	const source = toSanityImageSource(image);
	if (!source) return null;

	let imageBuilder = builder.image(source);

	if (typeof options.width === "number") {
		imageBuilder = imageBuilder.width(options.width);
	}
	if (typeof options.height === "number") {
		imageBuilder = imageBuilder.height(options.height);
	}
	if (typeof options.quality === "number") {
		imageBuilder = imageBuilder.quality(options.quality);
	}
	if (options.fit) {
		imageBuilder = imageBuilder.fit(options.fit);
	}
	if (options.auto) {
		imageBuilder = imageBuilder.auto(options.auto);
	}
	if (options.format) {
		imageBuilder = imageBuilder.format(options.format);
	}
	if (options.dpr) {
		imageBuilder = imageBuilder.dpr(options.dpr);
	}

	return imageBuilder.url();
}

/**
 * The image field in a fetched payload (`imageQuery`, or a raw Studio field), or `null` for
 * anything else — a Mux payload (`videoQuery`, it carries `playbackId`) included.
 */
export function resolveSanityImageFieldForUrl(
	payload: unknown,
): SanityImageField | null {
	if (!payload || typeof payload !== "object" || "playbackId" in payload) {
		return null;
	}
	const o = payload as Record<string, unknown>;
	const asset = o.asset as SanityImageAssetRef | null | undefined;
	if (!asset || typeof asset !== "object") return null;
	return {
		crop: o.crop,
		hotspot: o.hotspot,
		asset,
		alt: typeof o.alt === "string" ? o.alt : undefined,
	};
}
