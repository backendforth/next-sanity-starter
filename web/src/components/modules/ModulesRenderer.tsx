import { getSanityModuleLabel } from "@/sanity/utils";
import type { ContentModule, ModuleTextData } from "@/sanity/types/modules";
import { defaultLocale } from "@/src/i18n/config";
import { ModuleText } from "./ModuleText";

type ModulesRendererProps = {
  modules: ContentModule[];
  locale?: string;
};

/** Renders the document `modules[]` stack (one UI block per `module.*` type). */
export function ModulesRenderer({
  modules,
  locale = defaultLocale,
}: ModulesRendererProps) {
  return (
    <div className="flex flex-col gap-10">
      {modules.map((mod, index) => {
        const key = mod._key ?? `${mod._type ?? "module"}-${index}`;
        if (mod._type === "module.text") {
          return <ModuleText key={key} module={mod as ModuleTextData} locale={locale} />;
        }
        return (
          <div
            key={key}
          >
            <span>{getSanityModuleLabel(mod._type)}</span>
            <span>
              No frontend renderer for this module type yet.
            </span>
          </div>
        );
      })}
    </div>
  );
}
