import { Suspense } from "react";

import {
	LazyMediaVideo,
	LazyMediaVideoLoop,
} from "@/src/components/media/LazyVideo";
import { MediaImage } from "@/src/components/media/MediaImage";
import { isLoopIntent } from "@/src/utils/muxPlayback";

export type NormalizedSlide = {
	key: string;
	kind: "image" | "video" | "loop";
	media: unknown;
	poster?: unknown;
	caption?: string;
	/** Full-player slides only — autoplay / controls toggles. Ignored for loops. */
	videoSettings?: {
		autoplay?: boolean | null;
		controls?: boolean | null;
	} | null;
	/** Loop slides only — show the unmute control button. Default false. */
	allowUnmute?: boolean | null;
};

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
	if (slide.kind === "image") {
		return (
			<MediaImage
				imagePayload={slide.media}
				caption={slide.caption}
				fillParent
				objectFit="cover"
				priority={priority}
				sizes={imageSizes}
			/>
		);
	}

	if (slide.kind === "loop") {
		return (
			<LazyMediaVideoLoop
				media={slide.media}
				caption={slide.caption}
				posterPayload={slide.poster}
				posterPriority={priority}
				sizes={imageSizes}
				fillParent
				isActive={isActive}
				allowUnmute={slide.allowUnmute === true}
			/>
		);
	}

	if (isLoopIntent(slide.videoSettings)) {
		return (
			<LazyMediaVideoLoop
				media={slide.media}
				caption={slide.caption}
				posterPayload={slide.poster}
				posterPriority={priority}
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
			fillParent
			objectFit="cover"
			priority={priority}
			sizes={imageSizes}
		/>
	);
	if (!isActive) return poster;

	/* The player chunk loads when a video slide first becomes active, after hydration. Without
	   its own boundary that suspends up to the route and blanks the page meanwhile. */
	return (
		<Suspense fallback={poster}>
			<LazyMediaVideo
				media={slide.media}
				caption={slide.caption}
				posterPayload={slide.poster}
				videoSettings={slide.videoSettings}
				priority={priority}
				fillParent
			/>
		</Suspense>
	);
}
