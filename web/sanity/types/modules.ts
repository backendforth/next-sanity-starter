import type { IntlRichTextEntry } from "@/sanity/localizedPortableText";
import type { IntlStringEntry } from "@/sanity/localizedString";

export type SanityImageDimensions = {
  width?: number;
  height?: number;
  aspectRatio?: number;
};

export type SanityImageAssetRef = {
  _id?: string;
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

export type ModuleMediaData = {
  _type: "module.media";
  _key?: string;
  type?: "image" | "video";
  imageContent?: {
    caption?: string | null;
    image?: SanityImageField;
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
    poster?: {
      crop?: unknown;
      hotspot?: unknown;
      asset?: SanityImageAssetRef | null;
    } | null;
  } | null;
};

export type ModuleTextData = {
  _type: "module.text";
  _key?: string;
  title?: IntlStringEntry[] | null;
  body?: IntlRichTextEntry[] | null;
};

export type StackModule = {
  _type?: string;
  _key?: string;
} & Partial<ModuleTextData> &
  Partial<ModuleMediaData>;
