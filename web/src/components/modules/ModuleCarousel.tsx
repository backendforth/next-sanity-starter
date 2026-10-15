import type { ModuleOf, RichTextEmbedOf } from "@/sanity/types";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import { LazyCarouselViewport } from "@/src/components/carousel/LazyCarouselViewport";
import { normalizeCarouselSlides } from "@/src/components/carousel/normalizeCarouselSlides";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A `modules[]` entry or the same module inline in rich text. */
export type CarouselModule =
	| ModuleOf<"module.carousel">
	| RichTextEmbedOf<"module.carousel">;

type Props = {
	module: CarouselModule;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
	/** The page's LCP candidate: the first slide loads eagerly. */
	priority?: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_AUTOPLAY_DELAY_MS = 5000;

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `module.carousel` — heading + Embla viewport. Behavior fields come from Sanity
 * (`loop`, `showThumbnails`, `showNavDots`, `multipleSlides`, `autoplay`, …). A server
 * component: the heading and slides resolve here, the viewport is the lazy client part.
 */
export function ModuleCarousel({
	module,
	locale,
	siteLocale,
	priority = false,
}: Props) {
	const slides = normalizeCarouselSlides(module, locale, siteLocale);
	if (slides.length === 0) return null;

	const heading = pickLocalizedString(module.heading, locale, siteLocale);

	return (
		<section className={moduleSectionClassName}>
			{heading ? <h2 className={moduleHeadingClassName}>{heading}</h2> : null}
			<LazyCarouselViewport
				slides={slides}
				priority={priority}
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
