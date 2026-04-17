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
		lqip?: string | null;
	} | null;
};

export type SanityImageField = {
	crop?: unknown;
	hotspot?: unknown;
	asset?: SanityImageAssetRef | null;
} | null;
