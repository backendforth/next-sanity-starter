import type {
	ContentModule,
	ModuleCarouselData,
	ModuleContentRefsData,
	ModuleMediaData,
	ModuleTextData,
} from "@/sanity/types/modules";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import { getSanityModuleLabel } from "@/sanity/utils/sanityModuleLabel";
import { ModuleCarousel } from "@/src/components/carousel";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { ModuleMedia } from "./ModuleMedia";
import { ModuleText } from "./ModuleText";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	modules: ContentModule[];
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
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
export function ModulesRenderer({ modules, locale, siteLocale }: Props) {
	return (
		<div className="flex flex-col gap-10">
			{modules.map((mod, index) => {
				const key = mod._key ?? `${mod._type ?? "module"}-${index}`;
				if (mod._type === "module.text") {
					return (
						<ModuleText
							key={key}
							module={mod as ModuleTextData}
							locale={locale}
							siteLocale={siteLocale}
						/>
					);
				}
				if (mod._type === "module.media") {
					return <ModuleMedia key={key} module={mod as ModuleMediaData} />;
				}
				if (mod._type === "module.carousel") {
					return (
						<ModuleCarousel
							key={key}
							module={mod as ModuleCarouselData}
							locale={locale}
							siteLocale={siteLocale}
						/>
					);
				}
				if (mod._type === "module.contentRefs") {
					return (
						<ModuleContentRefsPlaceholder
							key={key}
							module={mod as ModuleContentRefsData}
							locale={locale}
							siteLocale={siteLocale}
						/>
					);
				}
				return <UnknownModule key={key} moduleType={mod._type} />;
			})}
		</div>
	);
}
