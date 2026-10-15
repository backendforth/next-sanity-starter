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
 * Normalize GROQ `resolvedSlides` into the shape {@link CarouselSlide} expects. With
 * `imagesOnly` the slides are plain images (`media` from `mediaQuery`); otherwise each slide is
 * a `module.media` with its `resolvedMedia`. The outer `resolvedMedia.kind` wins: a loop carries
 * a Mux asset that would look like a regular video at the asset level. Captions resolve to
 * `locale` here, so the client slides get plain strings.
 */
export function normalizeCarouselSlides(
	module: CarouselModule,
	locale: string,
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">,
): NormalizedSlide[] {
	const slides: NormalizedSlide[] = [];
	(module.resolvedSlides ?? []).forEach((slide, index) => {
		const key = slide._key ?? `slide-${index}`;
		if ("media" in slide) {
			if (!slide.media) return;
			slides.push({
				key,
				kind: slideKind(slide.media.kind) ?? "image",
				media: slide.media,
			});
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
			caption: pickLocalizedString(resolved.caption, locale, siteLocale),
			videoSettings:
				"videoSettings" in resolved ? (resolved.videoSettings ?? null) : null,
			allowUnmute:
				"allowUnmute" in resolved ? (resolved.allowUnmute ?? null) : null,
		});
	});
	return slides;
}
