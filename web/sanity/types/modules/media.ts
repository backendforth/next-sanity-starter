import type {
	MuxVideoPayload,
	SanityImageAssetRef,
	SanityImageField,
} from "./shared";

/** Unified shape from `mediaQuery` / `resolvedMedia.media`. */
export type ResolvedMediaPayload = {
	kind?: "image" | "video";
	[key: string]: unknown;
};

export type ModuleMediaData = {
	_type: "module.media";
	_key?: string;
	type?: "image" | "video" | "loop";
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
		video?: MuxVideoPayload | null;
		media?: ResolvedMediaPayload | null;
		poster?: {
			crop?: unknown;
			hotspot?: unknown;
			asset?: SanityImageAssetRef | null;
		} | null;
	} | null;
	videoLoopContent?: {
		caption?: string | null;
		allowUnmute?: boolean | null;
		video?: MuxVideoPayload | null;
		media?: ResolvedMediaPayload | null;
		poster?: {
			crop?: unknown;
			hotspot?: unknown;
			asset?: SanityImageAssetRef | null;
		} | null;
	} | null;
	resolvedMedia?: {
		kind?: "image" | "video" | "loop";
		caption?: string | null;
		videoSettings?: {
			autoplay?: boolean | null;
			controls?: boolean | null;
		} | null;
		allowUnmute?: boolean | null;
		media?: ResolvedMediaPayload | null;
		poster?: SanityImageField | null;
	} | null;
};
