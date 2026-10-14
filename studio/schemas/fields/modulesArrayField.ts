import { defineArrayMember, defineField } from "sanity";

import { moduleRowPreview } from "../../components/previews/ModuleRowPreview";

const MediaRowPreview = moduleRowPreview("Media");
const CarouselRowPreview = moduleRowPreview();

/** Types allowed in document-level `modules` arrays (keep in sync with `richTextMedia` block types). */
export const moduleTypes = [
  defineArrayMember({
    type: "module.media",
    components: { preview: MediaRowPreview },
  }),
  defineArrayMember({
    type: "module.carousel",
    components: { preview: CarouselRowPreview },
  }),
  { type: "module.contentRefs" },
  { type: "module.text" },
];

type ModulesArrayOptions = {
  /** Sanity field group name (e.g. `editorial`, `site`). Omit to place in the default group. */
  group?: string;
};

/**
 * Reusable field: ordered stack of modules on pages and content singletons.
 */
export function modulesArrayField(options?: ModulesArrayOptions) {
  return defineField({
    name: "modules",
    title: "Modules",
    description:
      "Content modules to be displayed on the page. Add any number; order is used on the frontend.",
    type: "array",
    ...(options?.group ? { group: options.group } : {}),
    of: [...moduleTypes],
  });
}
