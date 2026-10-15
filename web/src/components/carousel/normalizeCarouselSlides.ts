import { stegaClean } from "next-sanity";

import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import type { CarouselModule } from "@/src/components/modules/ModuleCarousel";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

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
 * {@link CarouselSlide} expects. Captions resolve to `locale` here, so the client slides get
 * plain strings.
 */
export function normalizeCarouselSlides(
	module: CarouselModule,
	locale: string,
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">,
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
			caption: pickLocalizedString(resolved.caption, locale, siteLocale),
			videoSettings:
				"videoSettings" in resolved ? (resolved.videoSettings ?? null) : null,
			allowUnmute:
				"allowUnmute" in resolved ? (resolved.allowUnmute ?? null) : null,
		});
	}
	return slides;
}
