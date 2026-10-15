import type { ModuleOf, RichTextEmbedOf } from "@/sanity/types";
import { isStegaVariant } from "@/sanity/utils/stegaVariant";
import { uiLabel } from "@/src/i18n/uiLabels";

import type { NormalizedMedia } from "./MediaByKind";

/** `moduleMediaResolvedMediaQuery`: the same shape for `module.media` and each carousel slide. */
type ResolvedMedia = (
	| ModuleOf<"module.media">
	| RichTextEmbedOf<"module.media">
)["resolvedMedia"];

/**
 * `resolvedMedia` → what {@link MediaByKind} renders, or `null` without media. The kind is read
 * clean (it may carry stega markers in Presentation), a video that autoplays without controls
 * becomes a loop (no player chrome), and the sound toggle's labels resolve to `locale`.
 */
export function normalizeResolvedMedia(
	resolved: ResolvedMedia,
	locale: string,
): NormalizedMedia | null {
	if (!resolved.media) return null;
	const caption = resolved.caption ?? undefined;

	if (isStegaVariant(resolved, "kind", "loop")) {
		return {
			kind: "loop",
			media: resolved.media,
			poster: resolved.poster ?? undefined,
			caption,
			soundLabels:
				resolved.allowUnmute === true
					? {
							soundOn: uiLabel("soundOn", locale),
							soundOff: uiLabel("soundOff", locale),
						}
					: undefined,
		};
	}
	if (isStegaVariant(resolved, "kind", "video")) {
		const settings = resolved.videoSettings;
		const isLoopIntent =
			settings?.autoplay === true && settings.controls === false;
		return {
			kind: isLoopIntent ? "loop" : "video",
			media: resolved.media,
			poster: resolved.poster ?? undefined,
			caption,
			videoSettings: settings,
		};
	}
	return { kind: "image", media: resolved.media, caption };
}
