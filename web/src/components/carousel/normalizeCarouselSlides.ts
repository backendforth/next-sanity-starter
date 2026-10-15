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
 * Normalize the GROQ `slides` (each a `module.media` with its `resolvedMedia`) into the shape
 * {@link CarouselSlide} expects.
 */
export function normalizeCarouselSlides(
	module: CarouselModule,
): NormalizedSlide[] {
	const slides: NormalizedSlide[] = [];
	for (const { _key: key, resolvedMedia: resolved } of module.slides ?? []) {
		const kind = slideKind(resolved.kind);
		if (!kind || !resolved.media) continue;
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
	}
	return slides;
}
