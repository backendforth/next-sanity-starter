import dynamic from "next/dynamic";
import type {
	ContentModule,
	ModuleMediaData,
	ModuleTextData,
} from "@/sanity/types/modules";
import { getSanityModuleLabel } from "@/sanity/utils/sanityModuleLabel";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

const ModuleMedia = dynamic(() =>
	import("./ModuleMedia").then((m) => m.ModuleMedia),
);
const ModuleText = dynamic(() =>
	import("./ModuleText").then((m) => m.ModuleText),
);

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	modules: ContentModule[];
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function UnknownModule({ moduleType }: { moduleType: string | undefined }) {
	return (
		<div>
			<span>{getSanityModuleLabel(moduleType)}</span>
			<span>No frontend renderer for this module type yet.</span>
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
				return <UnknownModule key={key} moduleType={mod._type} />;
			})}
		</div>
	);
}
