import type { CSSProperties } from "react";

import {
	getCroppedImageDisplayDimensions,
	resolveSanityImageFieldForUrl,
} from "@/sanity/utils/sanityImageBuilder";
import { getMuxDisplayDimensions } from "@/src/utils/muxImage";

import type { NormalizedSlide } from "./CarouselSlide";

/** Matches Tailwind `md:` → `--breakpoint-md` in `variables/breakpoints.css`. */
const MD_BREAKPOINT_PX = 1180;

/** One column of the `@container` viewport; the track sets `--slides` (2, or 3 from `md:`). */
const COLUMN_WIDTH =
	"(100cqw - var(--space-md) * (var(--slides) - 1)) / var(--slides)";

/** Native height ÷ width: the image (or poster), else the Mux track, else 16:9. */
function aspectHeightRatioForSlide(slide: NormalizedSlide): number {
	const image = resolveSanityImageFieldForUrl(
		slide.kind === "image" ? slide.media : slide.poster,
	);
	if (image) {
		const { width, height } = getCroppedImageDisplayDimensions(image);
		if (width > 0 && height > 0) return height / width;
	}
	if (slide.kind !== "image") {
		const dims = getMuxDisplayDimensions(slide.media);
		if (!dims.isFallback) return dims.height / dims.width;
	}
	return 9 / 16;
}

export type MultiSlideLayout = { style: CSSProperties; sizes: string };

/**
 * Multi-slide row: every slide is as tall as the tallest one at column width, and as wide as its
 * own aspect ratio needs. Plain CSS from the media's stored dimensions, so the server HTML already
 * has the final size (no measuring after mount, no layout shift).
 */
export function multiSlideLayout(
	slides: NormalizedSlide[],
): MultiSlideLayout[] {
	const ratios = slides.map(aspectHeightRatioForSlide);
	const rowRatio = Math.max(...ratios);

	return ratios.map((ratio) => {
		/* Slide width in columns. */
		const columns = rowRatio / ratio;
		return {
			style: {
				height: `calc(${COLUMN_WIDTH} * ${rowRatio})`,
				width: `calc(${COLUMN_WIDTH} * ${columns})`,
			},
			sizes: `(min-width: ${MD_BREAKPOINT_PX}px) ${Math.ceil((columns * 100) / 3)}vw, ${Math.ceil(columns * 50)}vw`,
		};
	});
}
