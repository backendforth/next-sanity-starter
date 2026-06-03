#!/usr/bin/env node
/**
 * Rewrites project `body[]` items from `internationalizedArrayRichTextValue`
 * to `internationalizedArrayRichTextMediaValue` after the schema switch to
 * `internationalizedArrayRichTextMedia`.
 *
 * Portable Text blocks inside `value` are unchanged — only the wrapper `_type` updates.
 *
 * Usage:
 *   pnpm run migrate:project-body-rich-text
 *   pnpm run migrate:project-body-rich-text -- --dry-run
 *   pnpm run migrate:project-body-rich-text -- --yes
 *
 * Auth (writes):
 *   1. `sanity login` in studio/ (recommended), or
 *   2. `SANITY_API_WRITE_TOKEN` / `SANITY_MIGRATION_TOKEN` in studio/.env
 *
 * Note: `SANITY_AUTH_TOKEN` from web read access is intentionally ignored — it cannot patch documents.
 */

import { createClient } from "@sanity/client";
import { loadEnvFile, studioRootFromScript } from "./loadEnvFile.mjs";
import { resolveSanityWriteToken } from "./resolveSanityWriteToken.mjs";

const studioRoot = studioRootFromScript(import.meta.url);
loadEnvFile(`${studioRoot}/.env`);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipConfirm = args.includes("--yes") || args.includes("-y");

const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim();
const dataset =
  process.env.SANITY_STUDIO_DATASET?.trim() ||
  process.env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() ||
  "development";

/** Read-only token from .env (web) — fine for GROQ fetch, not for patches. */
const readToken =
  process.env.SANITY_API_READ_TOKEN?.trim() ||
  process.env.SANITY_AUTH_TOKEN?.trim() ||
  undefined;

const { token: writeToken, source: writeTokenSource } =
  resolveSanityWriteToken(studioRoot);

if (!projectId) {
  console.error(
    "Missing SANITY_STUDIO_PROJECT_ID. Set it in studio/.env (see .env.example).",
  );
  process.exit(1);
}

if (!dryRun && !writeToken) {
  console.error(
    "No write token available.\n" +
      "  • Run `sanity login` in studio/, then retry\n" +
      "  • Or set SANITY_API_WRITE_TOKEN in studio/.env (Editor token from sanity.io/manage)",
  );
  process.exit(1);
}

const readClient = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token: readToken,
  useCdn: false,
});

const writeClient = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token: writeToken,
  useCdn: false,
});

const LEGACY_TYPE = "internationalizedArrayRichTextValue";
const TARGET_TYPE = "internationalizedArrayRichTextMediaValue";

function migrateBodyItem(entry) {
  if (!entry || typeof entry !== "object") {
    return entry;
  }
  if (entry._type !== LEGACY_TYPE) {
    return entry;
  }
  return {
    ...entry,
    _type: TARGET_TYPE,
  };
}

function bodyNeedsMigration(body) {
  if (!Array.isArray(body)) {
    return false;
  }
  return body.some((entry) => entry?._type === LEGACY_TYPE);
}

function migrateBody(body) {
  if (!Array.isArray(body)) {
    return body;
  }
  return body.map(migrateBodyItem);
}

function ask(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (data) => {
      resolve(String(data).trim().toLowerCase());
    });
  });
}

const query = `*[_type == "project" && defined(body)]{
  _id,
  title,
  "slug": slug.current,
  body
}`;

console.log(
  `Project body migration (${LEGACY_TYPE} → ${TARGET_TYPE})\n` +
    `  project: ${projectId}\n` +
    `  dataset: ${dataset}\n` +
    (readToken ? "  read: SANITY_API_READ_TOKEN / SANITY_AUTH_TOKEN\n" : "") +
    (writeTokenSource ? `  write: ${writeTokenSource}\n` : "") +
    (dryRun ? "  mode: dry-run\n" : ""),
);

const projects = await readClient.fetch(query);
const pending = projects.filter((doc) => bodyNeedsMigration(doc.body));

if (pending.length === 0) {
  console.log("No projects need migration.");
  process.exit(0);
}

console.log(`Found ${pending.length} project(s) to update:`);
for (const doc of pending) {
  const label =
    doc.slug ||
    (Array.isArray(doc.title)
      ? doc.title.find((t) => t?.value)?.value
      : null) ||
    doc._id;
  console.log(`  - ${label} (${doc._id})`);
}

if (dryRun) {
  console.log("\nDry run — no documents patched.");
  process.exit(0);
}

if (!skipConfirm) {
  const answer = await ask("\nPatch these documents? [y/N] ");
  if (answer !== "y" && answer !== "yes") {
    console.log("Aborted.");
    process.exit(0);
  }
}

let patched = 0;
for (const doc of pending) {
  try {
    await writeClient
      .patch(doc._id)
      .set({ body: migrateBody(doc.body) })
      .commit();
    patched += 1;
    console.log(`Patched ${doc._id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`\nFailed to patch ${doc._id}: ${message}`);
    console.error(
      "\nNeed write access:\n" +
        "  • `sanity login` in studio/ (uses CLI session, not SANITY_AUTH_TOKEN from .env)\n" +
        "  • Or SANITY_API_WRITE_TOKEN with Editor permissions in studio/.env",
    );
    process.exit(1);
  }
}

console.log(`\nDone. Updated ${patched} project(s).`);
