import type { ModuleOf, RichTextEmbedOf } from "@/sanity/types";
import type { NormalizedSlide } from "@/src/components/carousel/CarouselSlide";
import { LazyCarouselViewport } from "@/src/components/carousel/LazyCarouselViewport";
import { normalizeResolvedMedia } from "@/src/components/media/normalizeMedia";
import { uiLabel } from "@/src/i18n/uiLabels";

import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A `modules[]` entry or the same module inline in rich text. */
type CarouselModule =
	| ModuleOf<"module.carousel">
	| RichTextEmbedOf<"module.carousel">;

type Props = {
	module: CarouselModule;
	/** The route's locale, for the carousel's UI labels. */
	locale: string;
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
 * Document-level i18n: title/heading are plain strings (the whole document is
 * already in one locale).
 */
export function ModuleCarousel({ module, locale, priority = false }: Props) {
	const slides = (module.slides ?? []).flatMap((slide): NormalizedSlide[] => {
		const media = normalizeResolvedMedia(slide.resolvedMedia, locale);
		return media ? [{ key: slide._key, ...media }] : [];
	});
	if (slides.length === 0) return null;

	const heading =
		typeof module.heading === "string" ? module.heading.trim() : "";

	return (
		<section className={moduleSectionClassName}>
			{heading ? <h2 className={moduleHeadingClassName}>{heading}</h2> : null}
			<LazyCarouselViewport
				slides={slides}
				labels={{
					prev: uiLabel("carouselPrev", locale),
					next: uiLabel("carouselNext", locale),
					goToSlide: slides.map((_, i) =>
						uiLabel("carouselGoTo", locale, { n: i + 1 }),
					),
					showSlide: slides.map((_, i) =>
						uiLabel("carouselShow", locale, { n: i + 1 }),
					),
				}}
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
