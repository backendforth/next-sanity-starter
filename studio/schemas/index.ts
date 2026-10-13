import { page } from "./documents/page";
import { project } from "./documents/project";
import { projectCategory } from "./documents/projectCategory";
import { work } from "./documents/work";
import { trackerGoogleAnalytics } from "./objects/analytics/trackerGoogleAnalytics";
import { trackerMatomo } from "./objects/analytics/trackerMatomo";
import { trackerMicrosoftClarity } from "./objects/analytics/trackerMicrosoftClarity";
import { trackerPlausible } from "./objects/analytics/trackerPlausible";
import { trackerPostHog } from "./objects/analytics/trackerPostHog";
import { richText } from "./objects/editors/richText";
import { richTextMedia } from "./objects/editors/richTextMedia";
import { link } from "./objects/link";
import { linkFunctions } from "./objects/linkFunctions";
import { mediaImage } from "./objects/media/image";
import { mediaVideo } from "./objects/media/video";
import { mediaVideoLoop } from "./objects/media/videoLoop";
import { moduleCarousel } from "./objects/modules/moduleCarousel";
import { moduleContentRefs } from "./objects/modules/moduleContentRefs";
import { moduleMedia } from "./objects/modules/moduleMedia";
import { moduleText } from "./objects/modules/moduleText";
import { navLanguageSwitch } from "./objects/navLanguageSwitch";
import { navThemeToggle } from "./objects/navThemeToggle";
import { seoFallback, seoPage } from "./objects/seo/page";
import { errorSettings } from "./settings/error";
import { siteAnalyticsSettings } from "./settings/siteAnalyticsSettings";
import { siteCookieBanner } from "./settings/siteCookieBanner";
import { siteLanguageSettings } from "./settings/siteLanguageSettings";
import { siteNav } from "./settings/siteNav";
import { siteSettings } from "./settings/siteSettings";
import { home } from "./singletons/home";

export const schemaTypes = [
  linkFunctions,
  seoPage,
  seoFallback,
  link,
  navLanguageSwitch,
  navThemeToggle,
  mediaImage,
  mediaVideo,
  mediaVideoLoop,
  moduleCarousel,
  moduleMedia,
  moduleContentRefs,
  moduleText,
  richText,
  richTextMedia,
  siteSettings,
  siteLanguageSettings,
  siteNav,
  errorSettings,
  siteAnalyticsSettings,
  trackerGoogleAnalytics,
  trackerMatomo,
  trackerMicrosoftClarity,
  trackerPostHog,
  trackerPlausible,
  siteCookieBanner,
  home,
  work,
  page,
  project,
  projectCategory,
];
