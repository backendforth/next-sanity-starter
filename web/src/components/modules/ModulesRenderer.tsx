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

type ModuleContextProps = {
	/** Active route locale id — required for `module.contentRefs` href building. */
	locale: string;
	/** Site locale config — required for `module.contentRefs` href building. */
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

type Props = ModuleContextProps & {
	modules: ContentModule[];
	/** Document `_id` of the page rendering these modules. Used to mark each
	 * module as Presentation-tool clickable via `data-sanity`. */
	documentId: string;
	/** Document `_type` of the page rendering these modules. */
	documentType: string;
};

const IS_DEV = process.env.NODE_ENV === "development";

function UnknownModule({ moduleType }: { moduleType: string | undefined }) {
	if (!IS_DEV) {
		console.warn(
			`[ModulesRenderer] No renderer for module type "${moduleType ?? "?"}". ` +
				"Add one in web/src/components/modules/ or remove the schema in studio/.",
		);
		return null;
	}
	return (
		<div className="rounded-md border border-dashed border-color-warning p-4 text-sm text-color-warning">
			<strong className="block">{getSanityModuleLabel(moduleType)}</strong>
			<span className="block">
				No frontend renderer for this module type yet.
			</span>
		</div>
	);
}

function renderModuleChild(mod: ContentModule, ctx: ModuleContextProps) {
	if (mod._type === "module.text") {
		return <ModuleText module={mod as ModuleTextData} />;
	}
	if (mod._type === "module.media") {
		return <ModuleMedia module={mod as ModuleMediaData} />;
	}
	if (mod._type === "module.carousel") {
		return <ModuleCarousel module={mod as ModuleCarouselData} />;
	}
	if (mod._type === "module.contentRefs") {
		return (
			<ModuleContentRefs
				module={mod as ModuleContentRefsData}
				locale={ctx.locale}
				siteLocale={ctx.siteLocale}
			/>
		);
	}
	return <UnknownModule moduleType={mod._type} />;
}

/**
 * Renders the document `modules[]` stack. Each module is rendered server-side
 * (so module bundles stay out of the page's client chunk) and handed to a thin
 * client wrapper that orchestrates optimistic reordering when Visual Editing
 * dispatches a document update.
 *
 * Variant note: this is the `document-level` translation branch, so the
 * Presentation `data-sanity` attribute targets the `modules` array as a whole
 * (one attribute on the outer container) — clicking any module opens the
 * modules array in Studio, scoped to this document. The field-level (`main`)
 * branch attaches per-module attributes with deeper paths into the specific
 * localized sub-field instead.
 *
 * `@sanity/visual-editing-csm` rejects empty paths at runtime, so true
 * doc-only scopes (`{ id, type }` without path) are not possible — the
 * shallowest valid scope is the top-level field name.
 *
 * Modules without `_key` are kept in the initial order but cannot participate
 * in optimistic reordering — they'd lose their slot on the next Sanity update.
 * Production data from Sanity always carries `_key`s; this branch is only for
 * legacy edge cases.
 */
export function ModulesRenderer({
	modules,
	documentId,
	documentType,
	locale,
	siteLocale,
}: Props) {
	const containerSanityAttr = dataAttr({
		id: documentId,
		type: documentType,
		path: "modules",
	});
	const ctx: ModuleContextProps = { locale, siteLocale };
	const initialModules = modules.map((mod, index) => {
		const key = mod._key ?? `__legacy-${index}-${mod._type ?? "unknown"}`;
		return {
			_key: key,
			rendered: renderModuleChild(mod, ctx),
		};
	});

	return (
		<ModulesRendererClient
			documentId={documentId}
			initialModules={initialModules}
			containerSanityAttr={containerSanityAttr}
		/>
	);
}
