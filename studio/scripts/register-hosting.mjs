#!/usr/bin/env node
/**
 * Registers the self-hosted Studio's URL with Sanity and uploads its schema
 * (`sanity deploy --external`). Sanity Hosting does both on every `sanity deploy`;
 * a Studio on Netlify needs it as a separate step, or the project's Studio link in
 * sanity.io/manage and the schema store fall behind the deployed Studio.
 *
 * - Netlify (`studio/netlify.toml`, after `sanity build`): runs only on a production
 *   deploy with `SANITY_AUTH_TOKEN` set; previews and token-less sites log why and
 *   skip. The URL falls back to Netlify's `URL`, the site's primary domain.
 * - Locally (`pnpm studio:register`): uses your `sanity login` session and
 *   `SANITY_STUDIO_HOSTING_URL` from `studio/.env`. Extra args go to the CLI, e.g.
 *   `pnpm studio:register --dry-run`.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const studioRoot = fileURLToPath(new URL("..", import.meta.url));

const onNetlify = process.env.NETLIFY === "true";

function skip(reason) {
  console.log(`[register] Skipped: ${reason}`);
  process.exit(0);
}

function fail(message) {
  console.error(`[register] ${message}`);
  process.exit(1);
}

if (onNetlify) {
  if (process.env.CONTEXT !== "production") {
    skip(
      `Netlify context "${process.env.CONTEXT}" — only production deploys register.`,
    );
  }
  if (!process.env.SANITY_AUTH_TOKEN?.trim()) {
    skip(
      "SANITY_AUTH_TOKEN is not set. Add a deploy token to the Netlify site to register the URL and upload the schema on every production deploy.",
    );
  }
}

const rawUrl =
  process.env.SANITY_STUDIO_HOSTING_URL?.trim() ||
  (onNetlify ? process.env.URL?.trim() : "");

if (!rawUrl) {
  fail(
    "SANITY_STUDIO_HOSTING_URL is not set. Set it to the Studio's public URL (e.g. https://studio.example.com) in studio/.env or the host's environment.",
  );
}

let hostingUrl;
try {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") {
    fail(`SANITY_STUDIO_HOSTING_URL must use https: (got "${rawUrl}").`);
  }
  // Keeps a base path (`/studio`), drops query, hash and trailing slash.
  hostingUrl = `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
} catch {
  fail(`SANITY_STUDIO_HOSTING_URL is not a valid URL: "${rawUrl}".`);
}

console.log(`[register] Registering ${hostingUrl} as this project's Studio`);

const child = spawn(
  "pnpm",
  [
    "exec",
    "sanity",
    "deploy",
    "--external",
    "--url",
    hostingUrl,
    "--yes",
    ...process.argv.slice(2),
  ],
  {
    cwd: studioRoot,
    // `SANITY_STUDIO_APP_ID` names the `*.sanity.studio` deployment
    // (`sanity.cli.ts` → `deployment.appId`). Left set, it would point this
    // registration at that app instead of the external URL.
    env: { ...process.env, SANITY_STUDIO_APP_ID: "" },
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
