import "server-only";

import { draftMode } from "next/headers";
import type { ContentModule } from "@/sanity/types";
import { dataAttr } from "@/sanity/utils/dataAttr";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { LazyModulesRendererClient } from "./LazyModulesRendererClient";
import { ModuleCarousel } from "./ModuleCarousel";
import { ModuleContentRefs } from "./ModuleContentRefs";
import { ModuleMedia } from "./ModuleMedia";
import { ModulesStack, type PrerenderedModule } from "./ModulesStack";
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
		<div className="rounded-md border border-dashed border-color-danger p-sm text-sm text-color-danger">
			<strong className="block">{moduleType ?? "Unknown module"}</strong>
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
			return (
				<ModuleMedia
					module={mod}
					locale={locale}
					siteLocale={siteLocale}
					priority={priority}
				/>
			);
		case "module.carousel":
			return (
				<ModuleCarousel
					module={mod}
					locale={locale}
					siteLocale={siteLocale}
					priority={priority}
				/>
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
 * Renders the document `modules[]` stack. Each module is rendered server-side with the active
 * locale baked in, so module code stays out of the client bundle and translations resolve
 * before crossing the RSC seam. Visitors get `ModulesStack`, plain markup. In Draft Mode the
 * same nodes go to `ModulesRendererClient` (lazy), which reorders them optimistically when
 * Visual Editing dispatches a document update.
 *
 * In Draft Mode each module wrapper carries a field-level `data-sanity` path
 * (`modules[_key=="..."]`) so Presentation jumps directly to the right slot.
 */
export async function ModulesRenderer({
	modules,
	locale,
	siteLocale,
	documentId,
	documentType,
}: Props) {
	const isDraft = (await draftMode()).isEnabled;
	const initialModules: PrerenderedModule[] = modules.map((mod, index) => ({
		_key: mod._key,
		sanity: isDraft
			? dataAttr({
					id: documentId,
					type: documentType,
					path: `modules[_key=="${mod._key}"]`,
				})
			: undefined,
		/* The first module is the LCP candidate — its media loads eagerly. */
		rendered: renderModuleChild(mod, locale, siteLocale, index === 0),
	}));

	if (!isDraft) {
		return <ModulesStack modules={initialModules} />;
	}
	return (
		<LazyModulesRendererClient
			documentId={documentId}
			initialModules={initialModules}
		/>
	);
}
