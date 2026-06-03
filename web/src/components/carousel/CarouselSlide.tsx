"use client";

import clsx from "clsx";

import { MediaImage, MediaVideo, MediaVideoLoop } from "@/src/components/media";

export type NormalizedSlide = {
	key: string;
	kind: "image" | "video" | "loop";
	media: unknown;
	poster?: unknown;
	caption?: string | null;
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
	/** Responsive `sizes` for slide images (viewport differs in multi-slide mode). */
	imageSizes?: string;
	/** Multi-slide carousel: fixed row height, width from native aspect ratio. */
	respectAspectRatio?: boolean;
	rowHeightPx?: number;
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

const MULTI_SLIDE_MEDIA_CLASS = clsx(
	FIT_TO_PARENT,
	"h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover",
	"[&_video]:h-full [&_video]:w-full [&_video]:object-cover",
);

/**
 * Renders a single carousel slide. Inactive full-player videos render the poster only,
 * so audio/decoder work is scoped to the active slide.
 */
export function CarouselSlide({
	slide,
	isActive,
	imageSizes = "100vw",
	respectAspectRatio = false,
	rowHeightPx,
}: Props) {
	const multiSizes =
		respectAspectRatio && rowHeightPx
			? `${Math.ceil(rowHeightPx * 1.5)}px`
			: imageSizes;

	if (slide.kind === "image") {
		return (
			<MediaImage
				imagePayload={slide.media}
				caption={slide.caption ?? undefined}
				fillParent
				objectFit="cover"
				sizes={multiSizes}
				className={respectAspectRatio ? MULTI_SLIDE_MEDIA_CLASS : FIT_TO_PARENT}
			/>
		);
	}

	if (slide.kind === "loop") {
		return (
			<MediaVideoLoop
				media={slide.media}
				caption={slide.caption}
				posterPayload={slide.poster}
				fillParent
				isActive={isActive}
				allowUnmute={slide.allowUnmute === true}
				className={respectAspectRatio ? MULTI_SLIDE_MEDIA_CLASS : FIT_TO_PARENT}
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
				className={respectAspectRatio ? MULTI_SLIDE_MEDIA_CLASS : FIT_TO_PARENT}
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
				sizes={multiSizes}
				className={respectAspectRatio ? MULTI_SLIDE_MEDIA_CLASS : FIT_TO_PARENT}
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
			className={respectAspectRatio ? MULTI_SLIDE_MEDIA_CLASS : FIT_TO_PARENT}
		/>
	);
}
