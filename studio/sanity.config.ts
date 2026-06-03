import { codeInput } from "@sanity/code-input";
import { dashboardTool, projectInfoWidget } from "@sanity/dashboard";
import { documentInternationalization } from "@sanity/document-internationalization";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { media } from "sanity-plugin-media";
import { muxInput } from "sanity-plugin-mux-input";
import { netlifyTool } from "sanity-plugin-netlify";

import "./styles/portableTextStylePreviews.css";

import { initialValueTemplates } from "./config/initialValueTemplates";
import {
  presentationLocationsResolver,
  presentationMainDocuments,
} from "./config/presentation/resolve";
import { filterSingletonDocumentActions } from "./config/singletons";
import { structure } from "./config/structure";
import { studioDataset } from "./config/sync/studioDataset";
import { supportedLanguagesFromClient } from "./config/sync/supportedLanguages";
import { schemaTypes } from "./schemas";

/**
 * Document types that carry a `language` field and have parallel-per-locale
 * documents (see `@sanity/document-internationalization`). Add new translatable
 * types here AND on the schema (`language` field + `translatable: true` in
 * `singletons.ts` where it applies).
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
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN ?? "http://localhost:3000";

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
    dashboardTool({
      widgets: [projectInfoWidget()],
    }),
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
    codeInput(),
    ...(isDev ? [visionTool()] : []),
    media(),
    muxInput(),
    netlifyTool(),
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
  },
  initialValueTemplates,
});
