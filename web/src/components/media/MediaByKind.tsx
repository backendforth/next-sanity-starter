import { LazyMediaVideo, LazyMediaVideoLoop } from "./LazyVideo";
import { MediaImage } from "./MediaImage";

/** One `module.media` (or carousel slide) ready to render: see `normalizeResolvedMedia`. */
export type NormalizedMedia = {
	/** Clean kind; a video that autoplays without controls is a `loop`. */
	kind: "image" | "video" | "loop";
	/** The image (`imageQuery`) for `image`, the Mux video (`videoQuery`) otherwise. */
	media: unknown;
	/** Uploaded poster of a video or loop. */
	poster?: unknown;
	/** Resolved to the page locale. */
	caption?: string;
	/** `video` only: the player's autoplay / controls toggles. */
	videoSettings?: {
		autoplay?: boolean | null;
		controls?: boolean | null;
	} | null;
	/** `loop` only: show the sound toggle. */
	allowUnmute?: boolean;
};

type Props = {
	media: NormalizedMedia;
	/** LCP candidate: eager image / poster with `fetchpriority=high`, no fade-in. */
	priority?: boolean;
	/** `sizes` for the image or loop poster: the width the media occupies. */
	sizes?: string;
	/** Fill the parent instead of keeping the media's own aspect ratio. */
	fillParent?: boolean;
	/** Loops only: `false` keeps the loop paused (an inactive carousel slide). */
	isActive?: boolean;
};

/** The image, player or loop for a media kind — `ModuleMedia` and carousel slides. */
export function MediaByKind({
	media,
	priority,
	sizes,
	fillParent,
	isActive,
}: Props) {
	if (media.kind === "loop") {
		return (
			<LazyMediaVideoLoop
				media={media.media}
				caption={media.caption}
				posterPayload={media.poster}
				allowUnmute={media.allowUnmute}
				priority={priority}
				sizes={sizes}
				fillParent={fillParent}
				isActive={isActive}
			/>
		);
	}
	if (media.kind === "video") {
		return (
			<LazyMediaVideo
				media={media.media}
				caption={media.caption}
				posterPayload={media.poster}
				videoSettings={media.videoSettings}
				priority={priority}
				fillParent={fillParent}
			/>
		);
	}
	return (
		<MediaImage
			imagePayload={media.media}
			caption={media.caption}
			priority={priority}
			sizes={sizes}
			fillParent={fillParent}
		/>
	);
}
