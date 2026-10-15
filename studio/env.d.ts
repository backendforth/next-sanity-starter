declare module "*.css";

/**
 * The variables Studio code reads through `process.env`; Sanity inlines `SANITY_STUDIO_*` at
 * build time. The plain-Node scripts in `scripts/` read theirs untyped (all are documented in
 * `studio/.env.example`).
 */
declare namespace NodeJS {
  interface ProcessEnv {
    SANITY_STUDIO_PROJECT_ID?: string;
    SANITY_STUDIO_DATASET?: string;
    SANITY_STUDIO_DATASET_DEVELOPMENT?: string;
    SANITY_STUDIO_DATASET_PRODUCTION?: string;
    SANITY_STUDIO_DEPLOYMENT_TARGET?:
      | "development"
      | "preview"
      | "production"
      | string;
    SANITY_STUDIO_PREVIEW_ORIGIN?: string;
    SANITY_STUDIO_WEB_PREVIEW_ORIGINS?: string;
    SANITY_STUDIO_APP_ID?: string;
  }
}
