import { page } from "./documents/page";
import { richText } from "./objects/editors/richText";
import { richTextMedia } from "./objects/editors/richTextMedia";
import { link } from "./objects/link";
import { linkFunctions } from "./objects/linkFunctions";
import { mediaImage } from "./objects/media/image";
import { mediaVideo } from "./objects/media/video";
import { moduleCarousel } from "./objects/modules/moduleCarousel";
import { moduleContentRefs } from "./objects/modules/moduleContentRefs";
import { moduleMedia } from "./objects/modules/moduleMedia";
import { moduleText } from "./objects/modules/moduleText";
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
  mediaImage,
  mediaVideo,
  moduleCarousel,
  moduleMedia,
  moduleContentRefs,
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
