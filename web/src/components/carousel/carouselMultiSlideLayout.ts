import type { RefObject } from "react";
import { useEffect, useState } from "react";

import {
	getCroppedImageDisplayDimensions,
	resolveSanityImageFieldForUrl,
} from "@/sanity/utils/sanityImageBuilder";
import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
} from "@/src/utils/muxPlayback";

import type { NormalizedSlide } from "./CarouselSlide";

/** Matches Tailwind `md:` → `--breakpoint-md` in `variables/breakpoints.css`. */
const MD_BREAKPOINT_PX = 1180;

function parseCssLengthPx(raw: string): number | null {
	const value = raw.trim();
	if (!value) return null;
	if (value.endsWith("px")) return Number.parseFloat(value);
	if (value.endsWith("rem")) {
		const rem = Number.parseFloat(value);
		if (typeof document === "undefined") return null;
		const root = Number.parseFloat(
			getComputedStyle(document.documentElement).fontSize,
		);
		return rem * root;
	}
	return null;
}

function imageAspectHeightRatio(payload: unknown): number | null {
	const image = resolveSanityImageFieldForUrl(payload);
	if (!image) return null;
	const { width, height } = getCroppedImageDisplayDimensions(image);
	if (width <= 0 || height <= 0) return null;
	return height / width;
}

/** Native height ÷ width for `object-contain` at a fixed slide column width. */
export function aspectHeightRatioForSlide(
	slide: NormalizedSlide,
): number | null {
	if (slide.kind === "image") {
		return imageAspectHeightRatio(slide.media);
	}

	const posterRatio = imageAspectHeightRatio(slide.poster);
	if (posterRatio) return posterRatio;

	if (slide.kind === "video" || slide.kind === "loop") {
		const playbackId = extractMuxPlaybackId(slide.media);
		if (playbackId) {
			const dims = getMuxDisplayDimensions(slide.media);
			if (!dims.isFallback && dims.width > 0 && dims.height > 0) {
				return dims.height / dims.width;
			}
		}
	}

	return 9 / 16;
}

export function slidesPerViewForContainerWidth(
	containerWidthPx: number,
): number {
	return containerWidthPx >= MD_BREAKPOINT_PX ? 3 : 2;
}

export function slideColumnWidthPx(
	containerWidthPx: number,
	slidesPerView: number,
	gapPx: number,
): number {
	return (containerWidthPx - gapPx * (slidesPerView - 1)) / slidesPerView;
}

/** Row height so the tallest portrait fits the column width; all slides render at this height. */
export function multiSlideRowHeightPx(
	slides: NormalizedSlide[],
	containerWidthPx: number,
	gapPx: number,
): number {
	const slidesPerView = slidesPerViewForContainerWidth(containerWidthPx);
	const columnWidth = slideColumnWidthPx(
		containerWidthPx,
		slidesPerView,
		gapPx,
	);

	let maxHeight = 0;
	for (const slide of slides) {
		const ratio = aspectHeightRatioForSlide(slide);
		if (ratio != null) {
			maxHeight = Math.max(maxHeight, columnWidth * ratio);
		}
	}

	return maxHeight > 0
		? Math.ceil(maxHeight)
		: Math.ceil(columnWidth * (9 / 16));
}

/** Slide width when the image is scaled to a fixed row height (same height, native aspect). */
export function slideWidthAtRowHeightPx(
	slide: NormalizedSlide,
	rowHeightPx: number,
): number {
	const heightOverWidth = aspectHeightRatioForSlide(slide);
	if (!heightOverWidth) return rowHeightPx;
	return Math.ceil(rowHeightPx / heightOverWidth);
}

export function useMultiSlideRowHeight(
	enabled: boolean,
	slides: NormalizedSlide[],
	containerRef: RefObject<HTMLDivElement | null>,
): number | undefined {
	const [height, setHeight] = useState<number | undefined>();

	useEffect(() => {
		if (!enabled) {
			setHeight(undefined);
			return;
		}

		const el = containerRef.current;
		if (!el) return;

		const sync = () => {
			const width = el.clientWidth;
			if (width <= 0) return;

			const gapPx =
				parseCssLengthPx(
					getComputedStyle(document.documentElement).getPropertyValue(
						"--space-md",
					),
				) ?? 24;

			setHeight(multiSlideRowHeightPx(slides, width, gapPx));
		};

		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(el);
		window.addEventListener("resize", sync);

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", sync);
		};
	}, [containerRef, enabled, slides]);

	return height;
}
