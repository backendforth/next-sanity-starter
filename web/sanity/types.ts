/**
 * App-facing names for the generated query types in `sanity.types.gen.ts` (`pnpm generate`).
 * Everything here is derived, nothing is written by hand: a schema or query edit changes these
 * types on the next generate, and `tsc` then points at every consumer that no longer fits.
 *
 * Render-path data comes from `sanityFetch`, which types every string that may carry stega
 * markers in Presentation as `StegaString` (all but `_`-prefixed keys and slugs), so a literal
 * comparison does not compile. Compare through `stegaClean()` or `isStegaVariant()` — never
 * clean a whole document, that strips the markers the click-to-edit overlays need.
 */
import type { StegaBranded } from "next-sanity";

import type {
	HomeQueryResult,
	PageBySlugQueryResult,
	ProjectBySlugQueryResult,
	SiteChromeQueryResult,
	SiteLanguageSettingsQueryResult,
	WorkQueryResult,
} from "./sanity.types.gen";

// ── Route documents ─────────────────────────────────────────────────────────

export type HomeDocument = NonNullable<StegaBranded<HomeQueryResult>>;
export type PageDocument = NonNullable<StegaBranded<PageBySlugQueryResult>>;
export type WorkDocument = NonNullable<StegaBranded<WorkQueryResult>>;
export type ProjectDocument = NonNullable<
	StegaBranded<ProjectBySlugQueryResult>
>;
export type RouteDocument =
	| HomeDocument
	| PageDocument
	| WorkDocument
	| ProjectDocument;

/** A route document's own `seo` (`pageSeoQuery`), or the site-wide fallback of the same shape. */
export type PageSeo = RouteDocument["seo"];

// ── Modules ─────────────────────────────────────────────────────────────────

/** One entry of a document's `modules[]` — the union `ModulesRenderer` switches on. */
export type ContentModule = NonNullable<HomeDocument["modules"]>[number];
export type ModuleType = ContentModule["_type"];
/** The projected shape of one module type, e.g. `ModuleOf<"module.text">`. */
export type ModuleOf<T extends ModuleType> = Extract<
	ContentModule,
	{ _type: T }
>;

export type ContentRefTarget = NonNullable<
	NonNullable<ModuleOf<"module.contentRefs">["references"]>[number]
>;

// ── Rich text ───────────────────────────────────────────────────────────────

type RichTextMediaItem = NonNullable<
	NonNullable<ModuleOf<"module.text">["body"]>[number]["value"]
>[number];
/** A `richTextMedia` body for one locale: blocks plus the inline modules it allows. */
export type RichTextMediaValue = RichTextMediaItem[];
/** An inline module in rich text, e.g. `RichTextEmbedOf<"module.carousel">`. */
export type RichTextEmbedOf<T extends RichTextMediaItem["_type"]> = Extract<
	RichTextMediaItem,
	{ _type: T }
>;

type RichTextMarkDef = NonNullable<
	Extract<RichTextMediaItem, { _type: "block" }>["markDefs"]
>[number];
/** A resolved `link` annotation (`linkQuery`). */
export type LinkMark = Extract<RichTextMarkDef, { _type: "link" }>;

// ── App shell ───────────────────────────────────────────────────────────────

export type SiteChrome = StegaBranded<SiteChromeQueryResult>;
export type SiteNav = NonNullable<SiteChrome["nav"]>;
export type MainMenuItem = NonNullable<SiteNav["mainMenu"]>[number];
/** A link row in either menu, told apart by `linkType`. */
export type NavMenuLink = NonNullable<SiteNav["footerMenu"]>[number];
export type SiteCookieBanner = NonNullable<SiteChrome["cookieBanner"]>;
export type SiteSettings = NonNullable<SiteChrome["settings"]>;
/** The 404 copy (`errorSettings`). */
export type NotFoundCopy = NonNullable<SiteChrome["notFound"]>;
export type SiteFavicon = NonNullable<SiteSettings["favicon"]>;

/**
 * Clean, not `StegaBranded`: the layout hands `stegaClean(chrome.analytics)` on, because tracker
 * ids go to third-party scripts.
 */
export type SiteAnalyticsSettings = NonNullable<
	SiteChromeQueryResult["analytics"]
>;
export type AnalyticsTracker = NonNullable<
	SiteAnalyticsSettings["trackers"]
>[number];

export type SiteLanguageSettings = NonNullable<SiteLanguageSettingsQueryResult>;
