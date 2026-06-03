"use client";

import type {
	ModuleCarouselData,
	ModuleMediaData,
	ResolvedMediaPayload,
} from "@/sanity/types/modules";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import type { NormalizedSlide } from "./CarouselSlide";
import { CarouselViewport } from "./CarouselViewport";

type Props = {
	module: ModuleCarouselData;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

const DEFAULT_AUTOPLAY_DELAY_MS = 5000;

function payloadKind(
	payload: ResolvedMediaPayload | null | undefined,
): "image" | "video" | null {
	if (!payload) return null;
	if (payload.kind === "image" || payload.kind === "video") return payload.kind;
	return null;
}

/**
 * Editor-chosen slide kind. Prefers the outer `resolvedMedia.kind` (set by GROQ from
 * `module.media.type`) because loops carry a Mux asset that would otherwise be
 * indistinguishable from a regular video at the asset level.
 */
function slideKind(
	resolvedKind: "image" | "video" | "loop" | null | undefined,
	payload: ResolvedMediaPayload | null | undefined,
): "image" | "video" | "loop" | null {
	if (
		resolvedKind === "loop" ||
		resolvedKind === "video" ||
		resolvedKind === "image"
	) {
		return resolvedKind;
	}
	return payloadKind(payload);
}

/** Normalize the GROQ `resolvedSlides` into a single shape `CarouselSlide` understands. */
function normalizeSlides(module: ModuleCarouselData): NormalizedSlide[] {
	const imagesOnly = module.imagesOnly !== false;

	if (imagesOnly) {
		const source = module.resolvedSlides ?? module.slides ?? [];
		return source
			.map((slide, index): NormalizedSlide | null => {
				const media = slide.media ?? null;
				const kind = payloadKind(media) ?? "image";
				if (!media) return null;
				return {
					key: slide._key ?? `slide-${index}`,
					kind,
					media,
				};
			})
			.filter((s): s is NormalizedSlide => s !== null);
	}

	const source = module.resolvedSlides;
	if (source && source.length > 0) {
		return source
			.map((slide, index): NormalizedSlide | null => {
				const resolved = slide.resolvedMedia;
				if (!resolved) return null;
				const kind = slideKind(resolved.kind, resolved.media);
				if (!kind || !resolved.media) return null;
				return {
					key: slide._key ?? `slide-${index}`,
					kind,
					media: resolved.media,
					poster: resolved.poster ?? undefined,
					caption: resolved.caption ?? null,
					videoSettings:
						kind === "video" ? (resolved.videoSettings ?? null) : null,
					allowUnmute: kind === "loop" ? (resolved.allowUnmute ?? null) : null,
				};
			})
			.filter((s): s is NormalizedSlide => s !== null);
	}

	const fallback = module.slidesMedia ?? [];
	return fallback
		.map((slide: ModuleMediaData, index): NormalizedSlide | null => {
			if (slide.type === "image") {
				const imagePayload =
					slide.imageContent?.media ?? slide.imageContent?.image ?? null;
				if (!imagePayload) return null;
				return {
					key: slide._key ?? `slide-${index}`,
					kind: "image",
					media: imagePayload,
					caption: slide.imageContent?.caption ?? null,
				};
			}
			if (slide.type === "video" && slide.videoContent) {
				const muxField =
					slide.videoContent.media ?? slide.videoContent.video ?? null;
				if (!muxField) return null;
				return {
					key: slide._key ?? `slide-${index}`,
					kind: "video",
					media: muxField,
					poster: slide.videoContent.poster ?? undefined,
					caption: slide.videoContent.caption ?? null,
					videoSettings: slide.videoContent.videoSettings ?? null,
				};
			}
			if (slide.type === "loop" && slide.videoLoopContent) {
				const muxField =
					slide.videoLoopContent.media ?? slide.videoLoopContent.video ?? null;
				if (!muxField) return null;
				return {
					key: slide._key ?? `slide-${index}`,
					kind: "loop",
					media: muxField,
					poster: slide.videoLoopContent.poster ?? undefined,
					caption: slide.videoLoopContent.caption ?? null,
					allowUnmute: slide.videoLoopContent.allowUnmute ?? null,
				};
			}
			return null;
		})
		.filter((s): s is NormalizedSlide => s !== null);
}

/**
 * `module.carousel` renderer. Behavior fields (`loop`, `showThumbnails`, `showNavDots`,
 * `multipleSlides`, `autoplay`, `autoplayDelayMs`) come from Sanity and drive the embla viewport.
 */
export function ModuleCarousel({ module, locale, siteLocale }: Props) {
	const slides = normalizeSlides(module);
	if (slides.length === 0) return null;

	const heading = pickLocalizedString(module.heading, locale, siteLocale);

	return (
		<section className="flex flex-col">
			{heading ? <h2 className="content-title">{heading}</h2> : null}
			<CarouselViewport
				slides={slides}
				options={{
					loop: module.loop === true,
					showThumbnails: module.showThumbnails === true,
					showNavDots: module.showNavDots !== false,
					multipleSlides: module.multipleSlides === true,
					autoplay: module.autoplay === true,
					autoplayDelayMs:
						typeof module.autoplayDelayMs === "number"
							? module.autoplayDelayMs
							: DEFAULT_AUTOPLAY_DELAY_MS,
				}}
			/>
		</section>
	);
}
