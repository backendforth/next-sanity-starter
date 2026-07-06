import { CaseIcon } from "@sanity/icons/Case";
import { SearchIcon } from "@sanity/icons/Search";
import { TextIcon } from "@sanity/icons/Text";
import { defineType, type PreviewValue } from "sanity";
import { firstLocalizedLabel } from "../../utils/firstLocalizedLabel";
import { validateModuleMediaRequired } from "../../utils/validateModuleMedia";
import { validateSlug } from "../../utils/validateSlug";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  icon: CaseIcon,
  groups: [
    {
      title: "Editorial",
      name: "editorial",
      icon: TextIcon,
    },
    {
      title: "SEO",
      name: "seo",
      icon: SearchIcon,
    },
  ],
  fields: [
    {
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      group: "editorial",
      validation: (rule) => rule.required(),
    },
    {
      name: "titleMedia",
      title: "Title media",
      type: "module.media",
      group: "editorial",
      validation: (rule) => rule.required().custom(validateModuleMediaRequired),
    },
    {
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "projectCategory" }] }],
      group: "editorial",
    },
    {
      name: "slug",
      title: "Path",
      description:
        "URL path for this project (e.g. yoursite.com/work/my-path). Use lowercase letters, numbers, and hyphens.",
      type: "slug",
      options: {
        maxLength: 96,
      },
      validation: validateSlug,
      group: "editorial",
    },
    {
      name: "body",
      title: "Body",
      type: "internationalizedArrayRichTextMedia",
      group: "editorial",
    },
    {
      name: "seo",
      title: "SEO",
      type: "seo.page",
      group: "seo",
    },
  ],
  preview: {
    select: {
      titleEntries: "title",
      slug: "slug",
      titleMediaType: "titleMedia.type",
      titleMediaImage: "titleMedia.imageContent.image",
      titleMediaVideoPoster: "titleMedia.videoContent.poster",
      titleMediaLoopPoster: "titleMedia.videoLoopContent.poster",
    },
    prepare(selection) {
      const {
        titleEntries,
        slug,
        titleMediaType,
        titleMediaImage,
        titleMediaVideoPoster,
        titleMediaLoopPoster,
      } = selection;
      const segment = slug?.current?.trim();
      const path = segment ? `/work/${segment}` : "/work";
      const title = firstLocalizedLabel(titleEntries, path);

      type PreviewMedia = NonNullable<PreviewValue["media"]>;
      let media: PreviewMedia = CaseIcon as PreviewMedia;
      if (titleMediaType === "image" && titleMediaImage) {
        media = titleMediaImage as PreviewMedia;
      } else if (titleMediaType === "video" && titleMediaVideoPoster) {
        media = titleMediaVideoPoster as PreviewMedia;
      } else if (titleMediaType === "loop" && titleMediaLoopPoster) {
        media = titleMediaLoopPoster as PreviewMedia;
      }

      return {
        title,
        subtitle: title === path ? undefined : path,
        media,
      };
    },
  },
});
