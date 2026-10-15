import { stegaClean } from "next-sanity";

import type { CarouselModule } from "@/src/components/modules/ModuleCarousel";

import type { NormalizedSlide } from "./CarouselSlide";

type SlideKind = NormalizedSlide["kind"];

/** The clean `kind` of a slide — the values may carry stega markers in Presentation. */
function slideKind(kind: string | null | undefined): SlideKind | null {
	const clean = stegaClean(kind);
	return clean === "image" || clean === "video" || clean === "loop"
		? clean
		: null;
}

/**
 * Normalize GROQ `resolvedSlides` into the shape {@link CarouselSlide} expects. With
 * `imagesOnly` the slides are plain images (`media` from `imageQuery`); otherwise each slide is
 * a `module.media` with its `resolvedMedia`.
 */
export function normalizeCarouselSlides(
	module: CarouselModule,
): NormalizedSlide[] {
	const slides: NormalizedSlide[] = [];
	(module.resolvedSlides ?? []).forEach((slide, index) => {
		const key = slide._key ?? `slide-${index}`;
		if ("media" in slide) {
			if (!slide.media) return;
			slides.push({ key, kind: "image", media: slide.media });
			return;
		}
		const resolved = slide.resolvedMedia;
		const kind = slideKind(resolved.kind);
		if (!kind || !resolved.media) return;
		slides.push({
			key,
			kind,
			media: resolved.media,
			poster: "poster" in resolved ? (resolved.poster ?? undefined) : undefined,
			caption: resolved.caption ?? undefined,
			videoSettings:
				"videoSettings" in resolved ? (resolved.videoSettings ?? null) : null,
			allowUnmute:
				"allowUnmute" in resolved ? (resolved.allowUnmute ?? null) : null,
		});
	});
	return slides;
}
