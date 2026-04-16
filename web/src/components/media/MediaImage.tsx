import clsx from "clsx";
import type { CSSProperties } from "react";

import type { SanityImageField } from "@/sanity/types/modules";
import {
	cssObjectPositionFromSanityImageField,
	getCroppedImageDisplayDimensions,
	resolveSanityImageFieldForUrl,
	urlForFetchedImage,
} from "@/sanity/utils";

export type MediaImageProps = {
	imagePayload: unknown;
	alt?: string;
	caption?: string | null;
	/**
	 * Hint for layout / docs when using responsive images later; single `src` uses Sanity `w=`.
	 */
	sizesFallback?: string;
	className?: string;
	/** Full-bleed in parent (no fixed aspect ratio) — e.g. intro background. */
	fillParent?: boolean;
	/**
	 * `object-fit` for the image. Hotspot from Sanity sets `object-position` when present.
	 */
	objectFit?: CSSProperties["objectFit"];
};

function imageAltFromField(
	image: SanityImageField | undefined,
	alt?: string,
	caption?: string | null,
): string {
	if (typeof alt === "string" && alt.length > 0) return alt;
	const fromField = (image as { alt?: string | null } | null | undefined)?.alt;
	if (typeof fromField === "string" && fromField.length > 0) return fromField;
	if (typeof caption === "string" && caption.length > 0) return caption;
	return "";
}

/**
 * Sanity-driven image: **native `<img>`** with a deterministic Sanity CDN `src` (same on SSR and client).
 * Avoids `next/image` optimizer `src` / `srcSet` hydration drift.
 */
export function MediaImage({
	imagePayload,
	alt,
	caption,
	sizesFallback: _sizesFallback,
	className,
	fillParent = false,
	objectFit = "cover",
}: MediaImageProps) {
	void _sizesFallback;

	const image = resolveSanityImageFieldForUrl(imagePayload);
	if (!image) return null;

	const cropped = getCroppedImageDisplayDimensions(image);
	const requestWidth = Math.min(2400, Math.max(cropped.width, 320));
	const src = urlForFetchedImage(image, requestWidth);
	if (!src) return null;

	const objectPosition = cssObjectPositionFromSanityImageField(image);
	const imgStyle: CSSProperties = {
		objectFit: objectFit ?? "cover",
		...(objectPosition ? { objectPosition } : {}),
	};

	return (
		<div
			className={clsx(
				"relative w-full overflow-hidden",
				fillParent &&
					"h-full min-h-[100dvh] w-full [&_img]:h-full [&_img]:w-full",
				className,
			)}
			style={
				fillParent
					? undefined
					: { aspectRatio: `${cropped.width} / ${cropped.height}` }
			}
		>
			{/* biome-ignore lint/performance/noImgElement: deterministic Sanity URLs; next/image caused hydration mismatches */}
			<img
				src={src}
				alt={imageAltFromField(image, alt, caption)}
				loading="lazy"
				decoding="async"
				data-lazy=""
				className="absolute inset-0 block h-full w-full max-w-none"
				style={imgStyle}
			/>
		</div>
	);
}
