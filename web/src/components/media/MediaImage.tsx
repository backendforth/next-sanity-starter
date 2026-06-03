"use client";

import clsx from "clsx";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import type { SanityImageField } from "@/sanity/types/modules";
import {
	buildFetchedImageUrl,
	cssObjectPositionFromSanityImageField,
	getCroppedImageDisplayDimensions,
	resolveSanityImageFieldForUrl,
} from "@/sanity/utils/sanityImageBuilder";

/** Sanity CDN `w=` bounds — not layout breakpoints. */
const SANITY_IMAGE_MIN_WIDTH = 320;
const SANITY_IMAGE_MAX_WIDTH = 2400;
/** `srcset` candidates — mobile → 2× retina desktop. Caller caps by asset width. */
const SRCSET_WIDTHS = [480, 768, 1080, 1440, 1920, 2400] as const;
/** Grid / card previews — smallest variants that still cover at ~⅓ container width. */
export const PREVIEW_SRCSET_WIDTHS = [320, 480, 640, 768] as const;
export const PREVIEW_MAX_SRC_WIDTH = 768;

export type MediaImageProps = {
	imagePayload: unknown;
	alt?: string;
	caption?: string | null;
	className?: string;
	/** Full-bleed in parent (no fixed aspect ratio) — e.g. intro background. */
	fillParent?: boolean;
	/**
	 * `object-fit` for the image. Hotspot from Sanity sets `object-position` when present.
	 */
	objectFit?: CSSProperties["objectFit"];
	/**
	 * LCP candidate — use for the first visible image above the fold (e.g. hero).
	 *
	 * Sets `loading="eager"` + `fetchpriority="high"` and skips the lazy fade-in.
	 * Omit (default: false) for every image below the fold — those get lazy loading
	 * and the 0.2 s fade-in automatically.
	 *
	 * Rule of thumb: one `priority` image per page, on the largest above-the-fold image.
	 * Using it on multiple images defeats the purpose (browser can only prioritise one).
	 */
	priority?: boolean;
	/**
	 * `sizes` attribute hint. Tells the browser which viewport-relative width the image will
	 * occupy so it can pick the right `srcset` candidate.
	 * Defaults to `"100vw"`.
	 * @example "(max-width: 900px) 100vw, 50vw"
	 */
	sizes?: string;
	/** Cap largest CDN `w=` request (e.g. card previews). */
	maxSrcWidth?: number;
	/** Override default `srcset` width steps — use with {@link maxSrcWidth}. */
	srcsetWidths?: readonly number[];
	/** Sanity CDN quality (default 85). Lower for small previews. */
	quality?: number;
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

function buildSrcSet(
	image: SanityImageField,
	maxWidth: number,
	widths: readonly number[],
	quality: number,
): string {
	return widths
		.filter((w) => w <= maxWidth)
		.map((w) => {
			const url = buildFetchedImageUrl(image, {
				width: w,
				auto: "format",
				quality,
			});
			return url ? `${url} ${w}w` : null;
		})
		.filter(Boolean)
		.join(", ");
}

/**
 * Sanity-driven image: **native `<img>`** with deterministic Sanity CDN URLs (same SSR / client),
 * responsive `srcset` + `sizes` so the browser picks the right variant per container / viewport.
 *
 * Avoids `next/image` optimizer `src` / `srcSet` hydration drift.
 *
 * The `img-loaded` class is React-managed (via `useState` + `useEffect`) so the SSR markup
 * stays stable through hydration — adding the class from an inline boot script raced React
 * 19's streaming hydration on cached images and produced "tree hydrated but attributes
 * didn't match" warnings.
 */
export function MediaImage({
	imagePayload,
	alt,
	caption,
	className,
	fillParent = false,
	objectFit = "cover",
	priority = false,
	sizes = "100vw",
	maxSrcWidth: maxSrcWidthProp,
	srcsetWidths = SRCSET_WIDTHS,
	quality = 85,
}: MediaImageProps) {
	const image = resolveSanityImageFieldForUrl(imagePayload);
	const imgRef = useRef<HTMLImageElement>(null);
	/* Priority images skip the fade — they render visible immediately. Non-priority
	   images start at `loaded=false` (matches SSR) and flip to `true` from the load
	   handler in `useEffect` (or right away if cached). */
	const [loaded, setLoaded] = useState(priority);

	useEffect(() => {
		if (priority) return;
		const el = imgRef.current;
		if (!el) return;
		/* `complete` is also true for failed loads — reveal the element either way,
		   otherwise broken images stay at opacity:0 forever (load/error events have
		   already fired before this effect attaches its listeners). */
		if (el.complete) {
			setLoaded(true);
			return;
		}
		const onSettled = () => setLoaded(true);
		el.addEventListener("load", onSettled, { once: true });
		el.addEventListener("error", onSettled, { once: true });
		return () => {
			el.removeEventListener("load", onSettled);
			el.removeEventListener("error", onSettled);
		};
	}, [priority]);

	if (!image) return null;

	const cropped = getCroppedImageDisplayDimensions(image);
	/** Source image width caps the largest srcset candidate we request. */
	const maxSrcWidth = Math.min(
		maxSrcWidthProp ?? SANITY_IMAGE_MAX_WIDTH,
		SANITY_IMAGE_MAX_WIDTH,
		Math.max(cropped.width, SANITY_IMAGE_MIN_WIDTH),
	);

	const src = buildFetchedImageUrl(image, {
		width: maxSrcWidth,
		auto: "format",
		quality,
	});
	if (!src) return null;

	const srcSet = buildSrcSet(image, maxSrcWidth, srcsetWidths, quality);

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
				ref={imgRef}
				src={src}
				srcSet={srcSet || undefined}
				sizes={srcSet ? sizes : undefined}
				alt={imageAltFromField(image, alt, caption)}
				width={cropped.width}
				height={cropped.height}
				loading={priority ? "eager" : "lazy"}
				fetchPriority={priority ? "high" : "auto"}
				decoding={priority ? "sync" : "async"}
				{...(!priority && { "data-lazy": "" })}
				className={clsx(
					"absolute inset-0 block h-full w-full max-w-none",
					!priority && loaded && "img-loaded",
				)}
				style={imgStyle}
			/>
		</div>
	);
}
