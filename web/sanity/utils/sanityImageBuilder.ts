import {
	createImageUrlBuilder,
	type SanityImageSource,
} from "@sanity/image-url";

import {
	syncSanityDataset,
	syncSanityProjectId,
} from "@/sanity/sanitySyncConfig";
import type {
	SanityImageAssetRef,
	SanityImageField,
} from "@/sanity/types/modules";

type ImageFit = "clip" | "crop" | "fill" | "fillmax" | "max" | "scale" | "min";
type ImageAuto = "format";
type ImageOrientation = "portrait" | "landscape" | "square" | "unknown";

type BuildImageUrlOptions = {
	width?: number;
	height?: number;
	quality?: number;
	fit?: ImageFit;
	auto?: ImageAuto;
	dpr?: 1 | 2 | 3;
};

const builder = createImageUrlBuilder({
	projectId: syncSanityProjectId,
	dataset: syncSanityDataset,
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

export function getImageDimensions(image: SanityImageField): {
	width?: number;
	height?: number;
	aspectRatio?: number;
} {
	const dims = image?.asset?.metadata?.dimensions;
	return {
		width: dims?.width,
		height: dims?.height,
		aspectRatio: dims?.aspectRatio,
	};
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

/** Sanity image hotspot (normalized 0–1 on the original asset) — Studio “focus” UI. */
export type SanityImageHotspot = {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
};

/**
 * Maps Sanity `hotspot` to CSS `object-position` for use with `object-fit` (`cover`, `contain`, …).
 * `x` / `y` are 0–1 from the left / top; output is percentage pair as required by CSS.
 *
 * @see https://www.sanity.io/docs/image-type#hotspot
 */
export function cssObjectPositionFromSanityHotspot(
	hotspot: unknown,
): string | undefined {
	if (hotspot == null || typeof hotspot !== "object") {
		return undefined;
	}
	const h = hotspot as SanityImageHotspot;
	const x = typeof h.x === "number" && Number.isFinite(h.x) ? h.x : undefined;
	const y = typeof h.y === "number" && Number.isFinite(h.y) ? h.y : undefined;
	if (x === undefined || y === undefined) {
		return undefined;
	}
	const xp = Math.min(1, Math.max(0, x));
	const yp = Math.min(1, Math.max(0, y));
	return `${xp * 100}% ${yp * 100}%`;
}

/** Reads `hotspot` from a resolved image field (GROQ must project `hotspot`). */
export function cssObjectPositionFromSanityImageField(
	image: SanityImageField | null | undefined,
): string | undefined {
	if (!image?.hotspot) {
		return undefined;
	}
	return cssObjectPositionFromSanityHotspot(image.hotspot);
}

export function getImageOrientation(image: SanityImageField): ImageOrientation {
	const { width, height } = getImageDimensions(image);
	if (!width || !height) {
		return "unknown";
	}
	if (width === height) {
		return "square";
	}
	return width > height ? "landscape" : "portrait";
}

export function isPortraitImage(image: SanityImageField): boolean {
	return getImageOrientation(image) === "portrait";
}

export function isLandscapeImage(image: SanityImageField): boolean {
	return getImageOrientation(image) === "landscape";
}

export function getImageAspectRatio(
	image: SanityImageField,
	fallback = 16 / 9,
): number {
	const dims = getImageDimensions(image);
	if (
		typeof dims.aspectRatio === "number" &&
		Number.isFinite(dims.aspectRatio)
	) {
		return dims.aspectRatio;
	}
	if (
		typeof dims.width === "number" &&
		typeof dims.height === "number" &&
		dims.height > 0
	) {
		return dims.width / dims.height;
	}
	return fallback;
}

export function getImageLqip(image: SanityImageField): string | null {
	return image?.asset?.metadata?.lqip ?? null;
}

export function buildFetchedImageUrl(
	image: SanityImageField,
	options: BuildImageUrlOptions = {},
): string | null {
	/** Client bundles only see `NEXT_PUBLIC_*`; without it `projectId` can be empty and `@sanity/image-url` emits broken URLs. Prefer expanded `asset.url` from GROQ. */
	if (!syncSanityProjectId?.trim()) {
		const direct = image?.asset?.url;
		return typeof direct === "string" && direct.length > 0 ? direct : null;
	}

	const source = toSanityImageSource(image);
	if (!source) {
		return image?.asset?.url ?? null;
	}

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
	if (options.dpr) {
		imageBuilder = imageBuilder.dpr(options.dpr);
	}

	return imageBuilder.url();
}

export function urlForFetchedImage(
	image: SanityImageField,
	width = 1600,
): string | null {
	return buildFetchedImageUrl(image, {
		width,
		auto: "format",
		quality: 85,
	});
}

/**
 * GROQ `mediaQuery` attaches `kind: "image"` plus image fields.
 * Strip `kind` and pass through `crop`, `hotspot`, `asset`, optional `alt`.
 */
export function sanityImageFieldFromMediaQueryPayload(
	payload: unknown,
): SanityImageField | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}
	const o = payload as Record<string, unknown>;

	if (o.kind === "video") {
		return null;
	}

	const asset = o.asset as SanityImageAssetRef | null | undefined;
	if (!asset || typeof asset !== "object") {
		return null;
	}

	const img: SanityImageField = {
		crop: o.crop,
		hotspot: o.hotspot,
		asset,
	};
	if (typeof o.alt === "string") {
		(img as { alt?: string }).alt = o.alt;
	}
	return img;
}

/** `sanityImageFieldFromMediaQueryPayload` plus plain Studio image fields (no `kind`). */
export function resolveSanityImageFieldForUrl(
	payload: unknown,
): SanityImageField | null {
	const normalized = sanityImageFieldFromMediaQueryPayload(payload);
	if (normalized) {
		return normalized;
	}
	if (
		payload &&
		typeof payload === "object" &&
		"asset" in (payload as object) &&
		(payload as { kind?: string }).kind !== "video"
	) {
		return payload as SanityImageField;
	}
	return null;
}
