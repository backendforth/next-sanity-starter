import dynamic from "next/dynamic";
import type {
	ContentModule,
	ModuleCarouselData,
	ModuleContentRefsData,
	ModuleMediaData,
	ModuleTextData,
} from "@/sanity/types/modules";
import { dataAttr } from "@/sanity/utils/dataAttr";
import { getSanityModuleLabel } from "@/sanity/utils/sanityModuleLabel";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { ModuleContentRefs } from "./ModuleContentRefs";
import { ModuleMedia } from "./ModuleMedia";
import { ModulesRendererClient } from "./ModulesRendererClient";
import { ModuleText } from "./ModuleText";

/**
 * Carousel pulls in `embla-carousel-react` + `embla-carousel-autoplay` (~15 KB
 * gzipped of client JS). Loading it via `next/dynamic` defers the chunk fetch
 * until a page actually renders a carousel module — text- and media-only pages
 * never pay the cost. SSR stays on (default) so the first paint still includes
 * static slide markup.
 */
const ModuleCarousel = dynamic(() =>
	import("./ModuleCarousel").then((m) => m.ModuleCarousel),
);

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	modules: ContentModule[];
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
	/** Document `_id` of the page rendering these modules. Used to mark each
	 * module as Presentation-tool clickable via `data-sanity`. */
	documentId: string;
	/** Document `_type` of the page rendering these modules. */
	documentType: string;
};

const IS_DEV = process.env.NODE_ENV === "development";

// ─── Sub-components ──────────────────────────────────────────────────────────

function UnknownModule({ moduleType }: { moduleType: string | undefined }) {
	if (!IS_DEV) {
		console.warn(
			`[ModulesRenderer] No renderer for module type "${moduleType ?? "?"}". ` +
				"Add one in web/src/components/modules/ or remove the schema in studio/.",
		);
		return null;
	}
	return (
		<div className="rounded-md border border-dashed border-color-warning p-sm text-sm text-color-warning">
			<strong className="block">{getSanityModuleLabel(moduleType)}</strong>
			<span className="block">
				No frontend renderer for this module type yet.
			</span>
		</div>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

function renderModuleChild(
	mod: ContentModule,
	locale: string,
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">,
) {
	if (mod._type === "module.text") {
		return (
			<ModuleText
				module={mod as ModuleTextData}
				locale={locale}
				siteLocale={siteLocale}
			/>
		);
	}
	if (mod._type === "module.media") {
		return <ModuleMedia module={mod as ModuleMediaData} />;
	}
	if (mod._type === "module.carousel") {
		return (
			<ModuleCarousel
				module={mod as ModuleCarouselData}
				locale={locale}
				siteLocale={siteLocale}
			/>
		);
	}
	if (mod._type === "module.contentRefs") {
		return (
			<ModuleContentRefs
				module={mod as ModuleContentRefsData}
				locale={locale}
				siteLocale={siteLocale}
			/>
		);
	}
	return <UnknownModule moduleType={mod._type} />;
}

/**
 * Renders the document `modules[]` stack. Each module is rendered server-side
 * with the active locale baked in (so module bundles stay out of the page's
 * client chunk and translations are resolved before crossing the RSC seam),
 * then handed to a thin client wrapper that orchestrates optimistic reordering
 * when Visual Editing dispatches a document update.
 *
 * Each module wrapper carries a field-level `data-sanity` path
 * (`modules[_key=="..."]`) so Presentation jumps directly to the right slot.
 * Modules without `_key` are kept in the initial order but cannot participate
 * in optimistic reordering — they'd lose their slot on the next Sanity update.
 * Production data from Sanity always carries `_key`s; this branch is only for
 * legacy edge cases.
 */
export function ModulesRenderer({
	modules,
	locale,
	siteLocale,
	documentId,
	documentType,
}: Props) {
	const initialModules = modules.map((mod, index) => {
		const key = mod._key ?? `__legacy-${index}-${mod._type ?? "unknown"}`;
		const sanityAttr = mod._key
			? dataAttr({
					id: documentId,
					type: documentType,
					path: `modules[_key=="${mod._key}"]`,
				})
			: undefined;
		return {
			_key: key,
			rendered: (
				<div data-sanity={sanityAttr}>
					{renderModuleChild(mod, locale, siteLocale)}
				</div>
			),
		};
	});

	return (
		<ModulesRendererClient
			documentId={documentId}
			initialModules={initialModules}
		/>
	);
}
