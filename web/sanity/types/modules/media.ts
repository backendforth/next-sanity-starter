import type { SanityImageAssetRef, SanityImageField } from "./shared";

/** Unified shape from `mediaQuery` / `resolvedMedia.media`. */
export type ResolvedMediaPayload = {
	kind?: "image" | "video";
	[key: string]: unknown;
};

export type ModuleMediaData = {
	_type: "module.media";
	_key?: string;
	type?: "image" | "video";
	imageContent?: {
		caption?: string | null;
		image?: SanityImageField;
		media?: ResolvedMediaPayload | null;
	} | null;
	videoContent?: {
		caption?: string | null;
		videoSettings?: {
			autoplay?: boolean | null;
			controls?: boolean | null;
		} | null;
		video?: {
			asset?: {
				playbackId?: string | null;
				data?: {
					playbackId?: string | null;
					playback_ids?: Array<{ id?: string | null } | null> | null;
				} | null;
			} | null;
		} | null;
		media?: ResolvedMediaPayload | null;
		poster?: {
			crop?: unknown;
			hotspot?: unknown;
			asset?: SanityImageAssetRef | null;
		} | null;
	} | null;
	resolvedMedia?: {
		kind?: "image" | "video";
		caption?: string | null;
		videoSettings?: {
			autoplay?: boolean | null;
			controls?: boolean | null;
		} | null;
		media?: ResolvedMediaPayload | null;
		poster?: SanityImageField | null;
	} | null;
};
