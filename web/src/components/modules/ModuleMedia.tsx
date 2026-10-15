import type { ReactNode } from "react";

import type { ModuleOf, RichTextEmbedOf } from "@/sanity/types";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import { isStegaVariant } from "@/sanity/utils/stegaVariant";
import {
	LazyMediaVideo,
	LazyMediaVideoLoop,
} from "@/src/components/media/LazyVideo";
import { MediaImage } from "@/src/components/media/MediaImage";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { isLoopIntent } from "@/src/utils/muxPlayback";

import { moduleCaptionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A `modules[]` entry or the same module inline in rich text — both carry `resolvedMedia`. */
type MediaModule = ModuleOf<"module.media"> | RichTextEmbedOf<"module.media">;

type Props = {
	module: MediaModule;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function MediaFigure({
	caption,
	children,
}: {
	caption: string | undefined;
	children: ReactNode;
}) {
	return (
		<figure className="w-full min-w-0">
			{children}
			{caption ? (
				<figcaption className={moduleCaptionClassName}>{caption}</figcaption>
			) : null}
		</figure>
	);
}

function renderModuleMediaFigure(
	module: MediaModule,
	caption: string | undefined,
	priority: boolean,
) {
	const rm = module.resolvedMedia;
	if (!rm.media) return null;

	if (isStegaVariant(rm, "kind", "loop")) {
		return (
			<MediaFigure caption={caption}>
				<LazyMediaVideoLoop
					media={rm.media}
					caption={caption}
					posterPayload={rm.poster}
					allowUnmute={rm.allowUnmute === true}
					posterPriority={priority}
					sizes={MEDIA_SIZES}
				/>
			</MediaFigure>
		);
	}

	if (isStegaVariant(rm, "kind", "video")) {
		return (
			<MediaFigure caption={caption}>
				{isLoopIntent(rm.videoSettings) ? (
					<LazyMediaVideoLoop
						media={rm.media}
						caption={caption}
						posterPayload={rm.poster}
						posterPriority={priority}
						sizes={MEDIA_SIZES}
					/>
				) : (
					<LazyMediaVideo
						media={rm.media}
						caption={caption}
						posterPayload={rm.poster}
						videoSettings={rm.videoSettings}
						priority={priority}
					/>
				)}
			</MediaFigure>
		);
	}

	return (
		<MediaFigure caption={caption}>
			<MediaImage
				imagePayload={rm.media}
				caption={caption}
				priority={priority}
			/>
		</MediaFigure>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `module.media` — image, video (MuxPlayer), or silent loop, from the `resolvedMedia` GROQ
 * builds per kind. Its `select` always yields an object (image is the default branch), so there
 * is no fallback to the raw `*Content` fields.
 */
export function ModuleMedia({
	module,
	locale,
	siteLocale,
	priority = false,
}: Props) {
	/* One string for the figcaption and the client media's alt / aria-label fallbacks. */
	const caption = pickLocalizedString(
		module.resolvedMedia.caption,
		locale,
		siteLocale,
	);
	return renderModuleMediaFigure(module, caption, priority);
}
