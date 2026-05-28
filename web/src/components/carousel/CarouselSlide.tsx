"use client";

import { MediaImage, MediaVideo, MediaVideoLoop } from "@/src/components/media";

export type NormalizedSlide = {
	key: string;
	kind: "image" | "video";
	media: unknown;
	poster?: unknown;
	caption?: string | null;
	videoSettings?: {
		autoplay?: boolean | null;
		controls?: boolean | null;
	} | null;
};

type Props = {
	slide: NormalizedSlide;
	isActive: boolean;
};

/** `autoplay && !controls` → silent loop (no MuxPlayer chrome). Mirrors `ModuleMedia`. */
function isLoopIntent(settings: NormalizedSlide["videoSettings"]): boolean {
	return Boolean(settings?.autoplay) && settings?.controls === false;
}

/**
 * The shared media components apply `min-h-[100dvh]` when `fillParent` is set (designed
 * for hero sections). Inside a fixed-aspect carousel viewport that would blow out the
 * layout, so we override it back to `0`.
 */
const FIT_TO_PARENT = "!min-h-0";

/**
 * Renders a single carousel slide. Inactive full-player videos render the poster only,
 * so audio/decoder work is scoped to the active slide.
 */
export function CarouselSlide({ slide, isActive }: Props) {
	if (slide.kind === "image") {
		return (
			<MediaImage
				imagePayload={slide.media}
				caption={slide.caption ?? undefined}
				fillParent
				objectFit="cover"
				sizes="100vw"
				className={FIT_TO_PARENT}
			/>
		);
	}

	if (isLoopIntent(slide.videoSettings)) {
		return (
			<MediaVideoLoop
				media={slide.media}
				caption={slide.caption}
				posterPayload={slide.poster}
				fillParent
				isActive={isActive}
				className={FIT_TO_PARENT}
			/>
		);
	}

	if (!isActive) {
		return (
			<MediaImage
				imagePayload={slide.poster}
				caption={slide.caption ?? undefined}
				fillParent
				objectFit="cover"
				sizes="100vw"
				className={FIT_TO_PARENT}
			/>
		);
	}

	return (
		<MediaVideo
			media={slide.media}
			caption={slide.caption}
			posterPayload={slide.poster}
			videoSettings={slide.videoSettings}
			fillParent
			className={FIT_TO_PARENT}
		/>
	);
}
