"use client";

import type { ModuleCarouselData } from "@/sanity/types/modules";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import { CarouselViewport } from "@/src/components/carousel/CarouselViewport";
import { normalizeCarouselSlides } from "@/src/components/carousel/normalizeCarouselSlides";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	module: ModuleCarouselData;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
	/** `module` = document `modules[]` slot; `embed` = inline rich text (no section chrome). */
	variant?: "module" | "embed";
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_AUTOPLAY_DELAY_MS = 5000;

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `module.carousel` — heading + Embla viewport. Behavior fields come from Sanity
 * (`loop`, `showThumbnails`, `showNavDots`, `multipleSlides`, `autoplay`, …).
 */
export function ModuleCarousel({
	module,
	locale,
	siteLocale,
	variant = "module",
}: Props) {
	const slides = normalizeCarouselSlides(module);
	if (slides.length === 0) return null;

	const heading = pickLocalizedString(module.heading, locale, siteLocale);
	const sectionClassName =
		variant === "module" ? moduleSectionClassName : "flex flex-col";

	return (
		<section className={sectionClassName}>
			{heading ? <h2 className={moduleHeadingClassName}>{heading}</h2> : null}
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
