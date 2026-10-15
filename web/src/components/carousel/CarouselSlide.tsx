import { Suspense } from "react";

import {
	MediaByKind,
	type NormalizedMedia,
} from "@/src/components/media/MediaByKind";
import { MediaImage } from "@/src/components/media/MediaImage";

export type NormalizedSlide = NormalizedMedia & { key: string };

type Props = {
	slide: NormalizedSlide;
	isActive: boolean;
	/** LCP candidate: eager image / poster, no fade-in. */
	priority?: boolean;
	/** Responsive `sizes` for slide images (viewport differs in multi-slide mode). */
	imageSizes?: string;
};

/**
 * Renders a single carousel slide. Inactive full-player videos render the poster only,
 * so audio/decoder work is scoped to the active slide.
 */
export function CarouselSlide({
	slide,
	isActive,
	priority = false,
	imageSizes = "100vw",
}: Props) {
	if (slide.kind !== "video") {
		return (
			<MediaByKind
				media={slide}
				priority={priority}
				sizes={imageSizes}
				fillParent
				isActive={isActive}
			/>
		);
	}

	const poster = (
		<MediaImage
			imagePayload={slide.poster}
			muxFallbackMedia={slide.media}
			caption={slide.caption}
			priority={priority}
			sizes={imageSizes}
			fillParent
		/>
	);
	if (!isActive) return poster;

	/* The player chunk loads when a video slide first becomes active, after hydration. Without
	   its own boundary that suspends up to the route and blanks the page meanwhile. */
	return (
		<Suspense fallback={poster}>
			<MediaByKind
				media={slide}
				priority={priority}
				sizes={imageSizes}
				fillParent
			/>
		</Suspense>
	);
}
