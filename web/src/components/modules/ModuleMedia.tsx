import type { ModuleMediaData } from "@/sanity/types/modules";

import { MediaImage, MediaVideo } from "@/src/components/media";

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Single media block (`module.media`) — image or Mux video. Intended for full width
 * of the parent column (`w-full`).
 *
 * Prefer `resolvedMedia` from GROQ; falls back to `imageContent` / `videoContent` when needed.
 */
export function ModuleMedia({ module }: { module: ModuleMediaData }) {
	const rm = module.resolvedMedia;

	if (rm?.kind === "image" && rm.media) {
		return (
			<figure className="w-full min-w-0">
				<MediaImage imagePayload={rm.media} caption={rm.caption} />
				{rm.caption ? (
					<figcaption className="mt-2 text-color-text-muted paragraph-small">
						{rm.caption}
					</figcaption>
				) : null}
			</figure>
		);
	}

	if (rm?.kind === "video" && rm.media) {
		return (
			<figure className="w-full min-w-0">
				<MediaVideo
					media={rm.media}
					caption={rm.caption}
					posterPayload={rm.poster}
					videoSettings={rm.videoSettings}
				/>
				{rm.caption ? (
					<figcaption className="mt-2 text-color-text-muted paragraph-small">
						{rm.caption}
					</figcaption>
				) : null}
			</figure>
		);
	}

	const imagePayload = module.imageContent?.image ?? module.imageContent?.media;

	if (module.type === "image" && imagePayload) {
		return (
			<figure className="w-full min-w-0">
				<MediaImage
					imagePayload={imagePayload}
					caption={module.imageContent?.caption}
				/>
				{module.imageContent?.caption ? (
					<figcaption className="mt-2 text-color-text-muted paragraph-small">
						{module.imageContent.caption}
					</figcaption>
				) : null}
			</figure>
		);
	}

	if (module.type === "video" && module.videoContent) {
		const muxField = module.videoContent.video ?? module.videoContent.media;
		return (
			<figure className="w-full min-w-0">
				<MediaVideo
					media={muxField}
					caption={module.videoContent.caption}
					posterPayload={module.videoContent.poster}
					videoSettings={module.videoContent.videoSettings}
				/>
				{module.videoContent.caption ? (
					<figcaption className="mt-2 text-color-text-muted paragraph-small">
						{module.videoContent.caption}
					</figcaption>
				) : null}
			</figure>
		);
	}

	return null;
}
