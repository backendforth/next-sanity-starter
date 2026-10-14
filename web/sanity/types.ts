/**
 * App-facing names for the generated query types in `sanity.types.gen.ts` (`pnpm generate`).
 * Everything here is derived, nothing is written by hand: a schema or query edit changes these
 * types on the next generate, and `tsc` then points at every consumer that no longer fits.
 *
 * Render-path data comes from `sanityFetch`, which types every string that may carry stega
 * markers in Presentation as `StegaString` (all but `_`-prefixed keys and slugs). `StegaAware`
 * accepts both that and the clean shape (`client.fetch`, `stegaClean`). Compare such a value
 * to a literal through `stegaClean()` or `isStegaVariant()` — never clean a whole document, that
 * strips the markers the click-to-edit overlays need.
 */
import type { StegaBranded, StegaCleaned } from "next-sanity";

import type {
	HomeQueryResult,
	PageBySlugQueryResult,
	ProjectBySlugQueryResult,
	SiteChromeQueryResult,
	SiteLanguageSettingsQueryResult,
	WorkQueryResult,
} from "./sanity.types.gen";

/** A query result as `sanityFetch` may return it: clean or stega-branded. */
export type StegaAware<T> = StegaCleaned<T> | StegaBranded<T>;

// ── Route documents ─────────────────────────────────────────────────────────

export type HomeDocument = NonNullable<StegaAware<HomeQueryResult>>;
export type PageDocument = NonNullable<StegaAware<PageBySlugQueryResult>>;
export type WorkDocument = NonNullable<StegaAware<WorkQueryResult>>;
export type ProjectDocument = NonNullable<StegaAware<ProjectBySlugQueryResult>>;
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

/** Document-level i18n: a `richTextMedia` body is already in the document's language. */
type RichTextMediaItem = NonNullable<ModuleOf<"module.text">["body"]>[number];
/** A `richTextMedia` body: blocks plus the inline modules it allows. */
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

export type SiteChrome = StegaAware<SiteChromeQueryResult>;
export type SiteNav = NonNullable<SiteChrome["nav"]>;
export type MainMenuItem = NonNullable<SiteNav["mainMenu"]>[number];
/** A link row in either menu, told apart by `linkType`. */
export type NavMenuLink = NonNullable<SiteNav["footerMenu"]>[number];
export type SiteCookieBanner = NonNullable<SiteChrome["cookieBanner"]>;
export type SiteSettings = NonNullable<SiteChrome["settings"]>;
/** The 404 copy (`errorSettings`) of the chrome's language. */
export type NotFoundCopy = NonNullable<SiteChrome["notFound"]>;
export type SiteFavicon = NonNullable<SiteSettings["favicon"]>;

/**
 * Clean, not `StegaAware`: the layout hands `stegaClean(chrome.analytics)` on, because tracker
 * ids go to third-party scripts.
 */
export type SiteAnalyticsSettings = NonNullable<
	SiteChromeQueryResult["analytics"]
>;
export type AnalyticsTracker = NonNullable<
	SiteAnalyticsSettings["trackers"]
>[number];

export type SiteLanguageSettings = NonNullable<SiteLanguageSettingsQueryResult>;
