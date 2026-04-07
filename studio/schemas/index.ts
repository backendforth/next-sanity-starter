import { page } from "./documents/page";
import { richText } from "./objects/editors/richText";
import { richTextMedia } from "./objects/editors/richTextMedia";
import { link } from "./objects/link";
import { linkFunctions } from "./objects/linkFunctions";
import { moduleCarousel } from "./objects/modules/carousel";
import { moduleMedia } from "./objects/modules/media";
import { seoPage } from "./objects/seo/page";
import { errorSettings } from "./settings/error";
import { globalSeo } from "./settings/globalSeo";
import { siteSettings } from "./settings/siteSettings";
import { home } from "./singletons/home";

export const schemaTypes = [
  linkFunctions,
  seoPage,
  link,
  moduleCarousel,
  moduleMedia,
  richText,
  richTextMedia,
  siteSettings,
  globalSeo,
  errorSettings,
  home,
  page,
];
