"use client";

import clsx from "clsx";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import {
	cssObjectPositionFromSanityImageField,
	resolveSanityImageFieldForUrl,
	type SanityImageField,
} from "@/sanity/utils/sanityImageBuilder";
import { resolveMediaImageSource } from "@/src/utils/mediaImageSource";

type MediaImageProps = {
	imagePayload: unknown;
	/**
	 * Mux video payload — when `imagePayload` holds no Sanity image, the Mux thumbnail is shown
	 * instead (asset `thumbTime`, else the first frame). Used for video slides without a poster.
	 */
	muxFallbackMedia?: unknown;
	alt?: string;
	caption?: string | null;
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
	/** Sanity CDN quality (default 85). Lower for small previews. */
	quality?: number;
};

function imageAltFromField(
	image: SanityImageField | undefined,
	alt?: string,
	caption?: string | null,
): string {
	if (typeof alt === "string" && alt.length > 0) return alt;
	const fromField = image?.alt;
	if (typeof fromField === "string" && fromField.length > 0) return fromField;
	if (typeof caption === "string" && caption.length > 0) return caption;
	return "";
}

/**
 * Sanity-driven image (or the Mux thumbnail fallback): **native `<img>`** with deterministic URLs
 * (same SSR / client), responsive `srcset` + `sizes` so the browser picks the right variant per
 * container / viewport.
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
	muxFallbackMedia,
	alt,
	caption,
	fillParent = false,
	objectFit = "cover",
	priority = false,
	sizes = "100vw",
	quality,
}: MediaImageProps) {
	const image = resolveSanityImageFieldForUrl(imagePayload);
	const source = resolveMediaImageSource({
		image,
		muxMedia: muxFallbackMedia,
		quality,
	});
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

	if (!source) return null;

	return (
		<div
			className={clsx(
				"relative w-full overflow-hidden",
				fillParent && "h-full",
			)}
			style={
				fillParent
					? undefined
					: { aspectRatio: `${source.width} / ${source.height}` }
			}
		>
			{/* biome-ignore lint/performance/noImgElement: deterministic Sanity / Mux URLs; next/image caused hydration mismatches */}
			<img
				ref={imgRef}
				src={source.src}
				srcSet={source.srcSet}
				sizes={sizes}
				alt={imageAltFromField(image, alt, caption)}
				width={source.width}
				height={source.height}
				loading={priority ? "eager" : "lazy"}
				fetchPriority={priority ? "high" : "auto"}
				decoding={priority ? "sync" : "async"}
				{...(!priority && { "data-lazy": "" })}
				className={clsx(
					"absolute inset-0 block h-full w-full max-w-none",
					!priority && loaded && "img-loaded",
				)}
				style={{
					objectFit,
					objectPosition: cssObjectPositionFromSanityImageField(image),
				}}
			/>
		</div>
	);
}
