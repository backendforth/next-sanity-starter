import { page } from "./documents/page";
import { richText } from "./objects/editors/richText";
import { richTextMedia } from "./objects/editors/richTextMedia";
import { link } from "./objects/link";
import { linkFunctions } from "./objects/linkFunctions";
import { moduleCarousel } from "./objects/modules/carousel";
import { moduleMedia } from "./objects/modules/media";
import { moduleText } from "./objects/modules/text";
import { seoFallback, seoPage } from "./objects/seo/page";
import { errorSettings } from "./settings/error";
import { siteCookieBanner } from "./settings/siteCookieBanner";
import { siteNav } from "./settings/siteNav";
import { siteSettings } from "./settings/siteSettings";
import { home } from "./singletons/home";

export const schemaTypes = [
  linkFunctions,
  seoPage,
  seoFallback,
  link,
  moduleCarousel,
  moduleMedia,
  moduleText,
  richText,
  richTextMedia,
  siteSettings,
  siteNav,
  errorSettings,
  siteCookieBanner,
  home,
  page,
];
