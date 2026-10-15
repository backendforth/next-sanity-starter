import type { ModuleOf, RichTextEmbedOf } from "@/sanity/types";
import { MediaByKind } from "@/src/components/media/MediaByKind";
import { normalizeResolvedMedia } from "@/src/components/media/normalizeMedia";

import { moduleCaptionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A `modules[]` entry or the same module inline in rich text — both carry `resolvedMedia`. */
type MediaModule = ModuleOf<"module.media"> | RichTextEmbedOf<"module.media">;

type Props = {
	module: MediaModule;
	/** The route's locale, for the sound toggle's labels. */
	locale: string;
	/**
	 * The page's LCP candidate (first module, or first rich-text embed). Eager-loads the image /
	 * video poster (`fetchpriority=high`, no lazy fade-in).
	 */
	priority?: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * `sizes` for media in the page column, capped at `--content-max-width` (`--breakpoint-wide`);
 * `var()` is invalid in the `sizes` grammar, so the 2000px is a literal.
 */
const MEDIA_SIZES = "min(100vw, 2000px)";

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `module.media` — image, video (MuxPlayer), or silent loop, from the `resolvedMedia` GROQ
 * builds per kind. Its `select` always yields an object (image is the default branch), so there
 * is no fallback to the raw `*Content` fields.
 */
export function ModuleMedia({ module, locale, priority = false }: Props) {
	const media = normalizeResolvedMedia(module.resolvedMedia, locale);
	if (!media) return null;
	/* One caption for the figcaption and the client media's alt / aria-label fallbacks. */
	return (
		<figure className="w-full min-w-0">
			<MediaByKind media={media} priority={priority} sizes={MEDIA_SIZES} />
			{media.caption ? (
				<figcaption className={moduleCaptionClassName}>
					{media.caption}
				</figcaption>
			) : null}
		</figure>
	);
}
