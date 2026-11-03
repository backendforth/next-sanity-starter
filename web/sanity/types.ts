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

type HomeDocument = NonNullable<StegaBranded<HomeQueryResult>>;
type PageDocument = NonNullable<StegaBranded<PageBySlugQueryResult>>;
type WorkDocument = NonNullable<StegaBranded<WorkQueryResult>>;
type ProjectDocument = NonNullable<StegaBranded<ProjectBySlugQueryResult>>;
export type RouteDocument =
	| HomeDocument
	| PageDocument
	| WorkDocument
	| ProjectDocument;

// ── Modules ─────────────────────────────────────────────────────────────────

type PageStackModule = NonNullable<HomeDocument["modules"]>[number];
/**
 * One entry of a document's `modules[]` — the union `ModulesRenderer` switches on. With no module
 * in the page stack (`pnpm clear:modules`) TypeGen types `modules` as `null`; the stand-in then
 * keeps `ModulesRenderer` compiling until `pnpm gen:module` adds the first one.
 */
export type ContentModule = [PageStackModule] extends [never]
	? { _key: string; _type: never }
	: PageStackModule;
/**
 * A module wherever a query projects it: in a document's `modules[]` or inline in rich text. A
 * module that only one of the two holds keeps its type, so leaving the page stack changes nothing
 * for its component.
 */
type ProjectedModule =
	| PageStackModule
	| Extract<RichTextMediaItem, { _type: `module.${string}` }>;
/** The projected shape of one module type, e.g. `ModuleOf<"module.media">`. */
export type ModuleOf<T extends ProjectedModule["_type"]> = Extract<
	ProjectedModule,
	{ _type: T }
>;

// ── Rich text ───────────────────────────────────────────────────────────────

/**
 * Taken from the project body, a document field, so it does not depend on which modules a page
 * offers.
 */
type RichTextMediaItem = NonNullable<
	NonNullable<ProjectDocument["body"]>[number]["value"]
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

type SiteChrome = StegaBranded<SiteChromeQueryResult>;
type SiteNav = NonNullable<SiteChrome["nav"]>;
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
