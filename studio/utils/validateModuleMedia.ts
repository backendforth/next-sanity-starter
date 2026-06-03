import type { CustomValidator } from "sanity";

type ModuleMediaRow = {
  type?: string;
  imageContent?: { image?: { asset?: unknown } };
  videoContent?: { video?: { asset?: unknown } | null };
  videoLoopContent?: { video?: { asset?: unknown } | null };
};

function hasMuxAsset(mux: { asset?: unknown } | null | undefined): boolean {
  return (
    mux != null &&
    typeof mux === "object" &&
    "asset" in mux &&
    (mux as { asset?: unknown }).asset != null
  );
}

/** Shared validation for embedded `module.media` (e.g. project `titleMedia`). */
export const validateModuleMediaRequired: CustomValidator<
  ModuleMediaRow | undefined
> = (value) => {
  if (!value || typeof value !== "object") {
    return "Add title media.";
  }

  const type = value.type;
  if (type === "image") {
    if (!value.imageContent?.image?.asset) {
      return "Add an image.";
    }
    return true;
  }
  if (type === "video") {
    if (!hasMuxAsset(value.videoContent?.video ?? null)) {
      return "Add a video.";
    }
    return true;
  }
  if (type === "loop") {
    if (!hasMuxAsset(value.videoLoopContent?.video ?? null)) {
      return "Add a video.";
    }
    return true;
  }

  return "Select a media type.";
};
