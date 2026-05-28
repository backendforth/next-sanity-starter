import dynamic from "next/dynamic";
import type {
	ContentModule,
	ModuleCarouselData,
	ModuleContentRefsData,
	ModuleMediaData,
	ModuleTextData,
} from "@/sanity/types/modules";
import { dataAttr } from "@/sanity/utils/dataAttr";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import { getSanityModuleLabel } from "@/sanity/utils/sanityModuleLabel";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { ModuleMedia } from "./ModuleMedia";
import { ModuleText } from "./ModuleText";

/**
 * Carousel pulls in `embla-carousel-react` + `embla-carousel-autoplay` (~15 KB
 * gzipped of client JS). Loading it via `next/dynamic` defers the chunk fetch
 * until a page actually renders a carousel module — text- and media-only pages
 * never pay the cost. SSR stays on (default) so the first paint still includes
 * static slide markup.
 */
const ModuleCarousel = dynamic(() =>
	import("@/src/components/carousel").then((m) => m.ModuleCarousel),
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

function ModuleContentRefsPlaceholder({
	module,
	locale,
	siteLocale,
}: {
	module: ModuleContentRefsData;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
}) {
	if (!IS_DEV) return null;
	const heading = pickLocalizedString(module.heading, locale, siteLocale);
	const refCount = module.allowMultiple
		? (module.references?.length ?? 0)
		: module.reference
			? 1
			: 0;
	return (
		<div className="rounded-md border border-dashed border-color-border-subtle p-4 text-sm text-color-text-muted">
			<strong className="block">module.contentRefs</strong>
			{heading ? <span className="block">heading: {heading}</span> : null}
			<span className="block">
				references: {refCount} (no frontend renderer yet)
			</span>
		</div>
	);
}

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

// ─── Component ───────────────────────────────────────────────────────────────

/** Renders the document `modules[]` stack (one UI block per `module.*` type). */
export function ModulesRenderer({
	modules,
	locale,
	siteLocale,
	documentId,
	documentType,
}: Props) {
	return (
		<div className="flex flex-col gap-10">
			{modules.map((mod, index) => {
				const key = mod._key ?? `${mod._type ?? "module"}-${index}`;
				// Only modules with a stable `_key` can be reverse-mapped to a
				// GROQ path. Without `_key` (legacy data) the Presentation
				// overlay would target the wrong array slot, so we skip it.
				const sanityAttr = mod._key
					? dataAttr({
							id: documentId,
							type: documentType,
							path: `modules[_key=="${mod._key}"]`,
						})
					: undefined;
				const child = (() => {
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
							<ModuleContentRefsPlaceholder
								module={mod as ModuleContentRefsData}
								locale={locale}
								siteLocale={siteLocale}
							/>
						);
					}
					return <UnknownModule moduleType={mod._type} />;
				})();
				return (
					<div key={key} data-sanity={sanityAttr}>
						{child}
					</div>
				);
			})}
		</div>
	);
}
