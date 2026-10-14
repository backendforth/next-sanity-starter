import type { ContentModule } from "@/sanity/types";
import { dataAttr } from "@/sanity/utils/dataAttr";
import { getSanityModuleLabel } from "@/sanity/utils/sanityModuleLabel";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { ModuleCarousel } from "./ModuleCarousel";
import { ModuleContentRefs } from "./ModuleContentRefs";
import { ModuleMedia } from "./ModuleMedia";
import { ModulesRendererClient } from "./ModulesRendererClient";
import { ModuleText } from "./ModuleText";

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

/**
 * Data from before a deploy can hold a module type this build doesn't know yet; the generated
 * types can't. Dev shows a placeholder, production renders nothing.
 */
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
	priority: boolean,
) {
	switch (mod._type) {
		case "module.text":
			return (
				<ModuleText module={mod} locale={locale} siteLocale={siteLocale} />
			);
		case "module.media":
			return <ModuleMedia module={mod} priority={priority} />;
		case "module.carousel":
			return (
				<ModuleCarousel module={mod} locale={locale} siteLocale={siteLocale} />
			);
		case "module.contentRefs":
			return (
				<ModuleContentRefs
					module={mod}
					locale={locale}
					siteLocale={siteLocale}
					priority={priority}
				/>
			);
		default: {
			/* A module type the query returns but no `case` handles fails `tsc` here. */
			const unhandled: never = mod;
			return (
				<UnknownModule moduleType={(unhandled as { _type?: string })._type} />
			);
		}
	}
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
					{/* The first module is the LCP candidate — its media loads eagerly. */}
					{renderModuleChild(mod, locale, siteLocale, index === 0)}
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
