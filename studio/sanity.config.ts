import { documentInternationalization } from "@sanity/document-internationalization";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { media } from "sanity-plugin-media";
import { muxInput } from "sanity-plugin-mux-input";

import "./styles/fonts.css";
import "./styles/portableTextStylePreviews.css";

import { presentationLocationsResolver } from "./config/presentation/locationsResolver";
import { presentationMainDocuments } from "./config/presentation/resolve";
import {
  filterSingletonDocumentActions,
  isSingletonTemplate,
} from "./config/singletons";
import { structure } from "./config/structure";
import { studioDataset } from "./config/sync/studioDataset";
import { supportedLanguagesFromClient } from "./config/sync/supportedLanguages";
import { schemaTypes } from "./schemas";

/**
 * Document types that carry a `language` field and have parallel-per-locale
 * documents (see `@sanity/document-internationalization`). Add new translatable
 * types here AND add `languageField` (`schemas/fields/languageField.ts`) to the schema.
 */
const TRANSLATABLE_SCHEMA_TYPES = [
  "home",
  "page",
  "work",
  "project",
  "projectCategory",
  "errorSettings",
  "siteNav",
  "siteSettings",
  "siteCookieBanner",
];

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = studioDataset;
const previewOrigin =
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN || "http://localhost:3000";

if (!projectId) {
  throw new Error(
    "Missing SANITY_STUDIO_PROJECT_ID. Copy studio/.env.example to studio/.env and set your project ID.",
  );
}

const isDev = process.env.NODE_ENV === "development";

const webPreviewOrigins =
  process.env.SANITY_STUDIO_WEB_PREVIEW_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

export default defineConfig({
  name: "default",
  title: "Next Sanity Starter",
  projectId,
  dataset,
  releases: { enabled: isDev },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      title: "Web Preview",
      previewUrl: {
        initial: previewOrigin,
        previewMode: {
          enable: "/api/draft-mode/enable",
          disable: "/api/draft-mode/disable",
        },
      },
      // Next dev often uses `localhost` or `127.0.0.1` — both must be allowed for postMessage.
      allowOrigins: [
        "http://localhost:*",
        "http://127.0.0.1:*",
        ...webPreviewOrigins,
      ],
      resolve: {
        locations: presentationLocationsResolver,
        mainDocuments: presentationMainDocuments,
      },
    }),
    ...(isDev ? [visionTool()] : []),
    media(),
    muxInput({
      // Default encoding ceiling. `media.video` (2160p) and `media.videoLoop`
      // (1440p) set their own via field `options`, which override this.
      max_resolution_tier: "1440p",
      // Per-title encoding: lower bitrates on simple loops without visible loss.
      video_quality: "plus",
      // No download/embed flows — HLS-only playback on the site.
      mp4_support: "none",
    }),
    documentInternationalization({
      /** Loaded once per Studio session from `siteLanguageSettings`. */
      supportedLanguages: supportedLanguagesFromClient,
      schemaTypes: TRANSLATABLE_SCHEMA_TYPES,
      languageField: "language",
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (prev, { schemaType }) =>
      filterSingletonDocumentActions(prev, schemaType),
    // `global` is the "Create" menu, `document` feeds the "Create new" button of reference
    // inputs in a document pane; only `structure` items open singletons (by fixed id).
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === "structure"
        ? prev
        : prev.filter((item) => !isSingletonTemplate(item.templateId)),
  },
});
