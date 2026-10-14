export type SanityImageDimensions = {
	width?: number;
	height?: number;
	aspectRatio?: number;
};

export type SanityImageAssetRef = {
	_id?: string;
	_ref?: string;
	url?: string | null;
	metadata?: {
		dimensions?: SanityImageDimensions | null;
	} | null;
};

export type SanityImageField = {
	crop?: unknown;
	hotspot?: unknown;
	asset?: SanityImageAssetRef | null;
} | null;

/** `videoQuery` projection of a `mux.video` field (`queries/snippets/media.ts`). */
export type MuxVideoPayload = {
	playbackId?: string | null;
	duration?: number | null;
	asset?: {
		playbackId?: string | null;
		/** Poster frame picked in Studio, in seconds. */
		thumbTime?: number | null;
		data?: {
			playbackId?: string | null;
			playback_ids?: Array<{ id?: string | null } | null> | null;
			tracks?: Array<{
				type?: string | null;
				max_width?: number | null;
				max_height?: number | null;
			} | null> | null;
		} | null;
	} | null;
};
