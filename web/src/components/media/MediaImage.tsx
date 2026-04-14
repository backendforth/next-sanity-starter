"use client";

import clsx from "clsx";
import Image from "next/image";

import type { SanityImageField } from "@/sanity/types/modules";
import {
	getCroppedImageDisplayDimensions,
	getImageLqip,
	resolveSanityImageFieldForUrl,
	urlForFetchedImage,
} from "@/sanity/utils";

import { useContainerPixelWidth } from "@/src/utils/useContainerPixelWidth";

export type MediaImageProps = {
	imagePayload: unknown;
	alt?: string;
	caption?: string | null;
	/**
	 * `sizes` when the container width is not measured yet (SSR / first paint).
	 * Must describe the same layout width as the slot.
	 */
	sizesFallback?: string;
	className?: string;
};

const DEFAULT_SIZES_FALLBACK =
	"(max-width: 900px) 100vw, min(100vw, var(--container-width, 1200px))";

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
 * Sanity image with crop-aware aspect ratio, LQIP blur, lazy load, and `sizes` driven by the
 * real container width so the browser picks an appropriate `srcset` width (updates on resize).
 */
export function MediaImage({
	imagePayload,
	alt,
	caption,
	sizesFallback = DEFAULT_SIZES_FALLBACK,
	className,
}: MediaImageProps) {
	const image = resolveSanityImageFieldForUrl(imagePayload);
	const [ref, slotWidthPx] = useContainerPixelWidth<HTMLDivElement>();

	if (!image) return null;

	const cropped = getCroppedImageDisplayDimensions(image);
	const requestWidth = Math.min(2400, Math.max(cropped.width, 320));
	const url = urlForFetchedImage(image, requestWidth);
	if (!url) return null;

	const lqip = getImageLqip(image);
	const sizes =
		typeof slotWidthPx === "number" && slotWidthPx > 0
			? `${slotWidthPx}px`
			: sizesFallback;

	return (
		<div
			ref={ref}
			className={clsx(
				"relative w-full overflow-hidden bg-color-text/5",
				className,
			)}
			style={{ aspectRatio: `${cropped.width} / ${cropped.height}` }}
		>
			<Image
				src={url}
				alt={imageAltFromField(image, alt, caption)}
				fill
				sizes={sizes}
				loading="lazy"
				quality={85}
				placeholder={lqip ? "blur" : "empty"}
				blurDataURL={lqip ?? undefined}
				className="object-cover"
			/>
		</div>
	);
}
