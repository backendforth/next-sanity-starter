declare module "*.css";

/**
 * Sanity Studio uses Vite — `SANITY_STUDIO_*` and `VITE_*` env vars are inlined at build time.
 * Mirror the documented variables here so editors get autocomplete and type checking.
 *
 * Keep in sync with `studio/.env.example` and `packages/sanity-dataset-resolve`.
 */
interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly SSR: boolean;
  readonly BASE_URL: string;
  readonly SANITY_STUDIO_PROJECT_ID: string;
  readonly SANITY_STUDIO_DATASET?: string;
  readonly SANITY_STUDIO_DATASET_DEVELOPMENT?: string;
  readonly SANITY_STUDIO_DATASET_PRODUCTION?: string;
  readonly SANITY_STUDIO_DEPLOYMENT_TARGET?:
    | "development"
    | "preview"
    | "production"
    | string;
  readonly SANITY_STUDIO_PREVIEW_ORIGIN?: string;
  readonly SANITY_STUDIO_WEB_PREVIEW_ORIGINS?: string;
  readonly SANITY_STUDIO_HOSTING_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
    SANITY_DATASET_RESOLVER_TOKEN?: string;
    SANITY_API_READ_TOKEN?: string;
    SANITY_STUDIO_HOSTING_URL?: string;
    SANITY_STUDIO_APP_ID?: string;
    SANITY_AUTH_TOKEN?: string;
  }
}
