import { moduleLabel } from "@/sanity/moduleLabel";
import type { ModuleTextData, StackModule } from "@/sanity/types/modules";
import { ModuleText } from "./ModuleText";

export type { StackModule } from "@/sanity/types/modules";

type ModuleStackProps = {
  modules: StackModule[];
  locale?: string;
};

export function ModuleStack({ modules, locale = "en" }: ModuleStackProps) {
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
            className="rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            <span className="font-medium text-zinc-600 dark:text-zinc-300">{moduleLabel(mod._type)}</span>
            <span className="block text-xs text-zinc-400 dark:text-zinc-500">
              No frontend renderer for this module type yet.
            </span>
          </div>
        );
      })}
    </div>
  );
}
