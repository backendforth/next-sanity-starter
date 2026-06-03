import type { IntlStringEntry } from "@/sanity/utils";
import type { ModuleMediaData, ResolvedMediaPayload } from "./media";

export type ModuleCarouselData = {
	_type: "module.carousel";
	_key?: string;
	heading?: IntlStringEntry[] | null;
	imagesOnly?: boolean | null;
	loop?: boolean | null;
	showThumbnails?: boolean | null;
	showNavDots?: boolean | null;
	multipleSlides?: boolean | null;
	autoplay?: boolean | null;
	autoplayDelayMs?: number | null;
	/** Image slides: each slide has `media` from `mediaQuery` (kind + payload). */
	slides?: Array<{
		_key?: string;
		_type?: string;
		media?: ResolvedMediaPayload | null;
	}> | null;
	slidesMedia?: Array<ModuleMediaData> | null;
	resolvedSlides?: Array<{
		_key?: string;
		_type?: string;
		media?: ResolvedMediaPayload | null;
		resolvedMedia?: ModuleMediaData["resolvedMedia"];
	}> | null;
};
