#!/usr/bin/env node
/**
 * Wraps plain-string `seo.title` / `seo.description` into
 * `internationalizedArrayString` / `internationalizedArrayText` after the SEO
 * fields (`seo.page`, `seo.fallback`) became translatable.
 *
 * The existing text becomes the entry for the site's default language
 * (`siteLanguageSettings.defaultLanguageId`, override with `--language <id>`).
 * Empty strings are unset. Values that are already arrays are skipped, so the
 * script is safe to re-run. Drafts are migrated alongside published documents.
 *
 * Usage:
 *   pnpm run migrate:seo-i18n
 *   pnpm run migrate:seo-i18n -- --dry-run
 *   pnpm run migrate:seo-i18n -- --yes
 *   pnpm run migrate:seo-i18n -- --language de
 *
 * Auth (writes):
 *   1. `sanity login` in studio/ (recommended), or
 *   2. `SANITY_API_WRITE_TOKEN` / `SANITY_MIGRATION_TOKEN` in studio/.env
 */

import { randomBytes } from "node:crypto";
import { createClient } from "@sanity/client";
import { loadEnvFile, studioRootFromScript } from "./loadEnvFile.mjs";
import { resolveSanityWriteToken } from "./resolveSanityWriteToken.mjs";

const studioRoot = studioRootFromScript(import.meta.url);
loadEnvFile(`${studioRoot}/.env`);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipConfirm = args.includes("--yes") || args.includes("-y");
const languageArgIndex = args.indexOf("--language");
const languageArg =
  languageArgIndex >= 0 ? args[languageArgIndex + 1]?.trim() : undefined;

const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim();
const dataset =
  process.env.SANITY_STUDIO_DATASET?.trim() ||
  process.env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() ||
  "development";

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

/* `raw` so drafts come back as their own documents and get patched too. */
const clientConfig = {
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: false,
  perspective: "raw",
};
const readClient = createClient({
  ...clientConfig,
  token: writeToken || readToken,
});
const writeClient = createClient({ ...clientConfig, token: writeToken });

const FIELDS = [
  { name: "title", valueType: "internationalizedArrayStringValue" },
  { name: "description", valueType: "internationalizedArrayTextValue" },
];

function ask(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (data) => {
      resolve(String(data).trim().toLowerCase());
    });
  });
}

const languageSettings = await readClient.fetch(
  `*[_id == "siteLanguageSettings"][0]{ defaultLanguageId, "first": availableLanguages[0].id }`,
);
const language =
  languageArg ||
  languageSettings?.defaultLanguageId?.trim() ||
  languageSettings?.first?.trim();

if (!language) {
  console.error(
    "Could not read a default language from siteLanguageSettings — pass --language <id>.",
  );
  process.exit(1);
}

const documents = await readClient.fetch(
  `*[defined(seo.title) || defined(seo.description)]{
    _id,
    _type,
    "title": seo.title,
    "description": seo.description
  }`,
);

/** `set` / `unset` patch for one document, or `null` when nothing is left to migrate. */
function patchFor(doc) {
  const set = {};
  const unset = [];
  for (const { name, valueType } of FIELDS) {
    const value = doc[name];
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (!text) {
      unset.push(`seo.${name}`);
      continue;
    }
    set[`seo.${name}`] = [
      {
        _key: randomBytes(16).toString("hex"),
        _type: valueType,
        language,
        value: text,
      },
    ];
  }
  if (Object.keys(set).length === 0 && unset.length === 0) return null;
  return { set, unset };
}

console.log(
  "SEO i18n migration (plain string → internationalizedArray*)\n" +
    `  project: ${projectId}\n` +
    `  dataset: ${dataset}\n` +
    `  language: ${language}\n` +
    (writeTokenSource ? `  write: ${writeTokenSource}\n` : "") +
    (dryRun ? "  mode: dry-run\n" : ""),
);

const pending = documents
  .map((doc) => ({ doc, patch: patchFor(doc) }))
  .filter((entry) => entry.patch);

if (pending.length === 0) {
  console.log("No documents need migration.");
  process.exit(0);
}

console.log(`Found ${pending.length} document(s) to update:`);
for (const { doc, patch } of pending) {
  const fields = [
    ...Object.keys(patch.set),
    ...patch.unset.map((path) => `${path} (empty, unset)`),
  ];
  console.log(`  - ${doc._id} (${doc._type}): ${fields.join(", ")}`);
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

const transaction = writeClient.transaction();
for (const { doc, patch } of pending) {
  transaction.patch(doc._id, (p) => {
    let next = p;
    if (Object.keys(patch.set).length > 0) next = next.set(patch.set);
    if (patch.unset.length > 0) next = next.unset(patch.unset);
    return next;
  });
}

try {
  await transaction.commit();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`\nMigration failed, nothing was written: ${message}`);
  console.error(
    "\nNeed write access:\n" +
      "  • `sanity login` in studio/ (uses CLI session, not SANITY_AUTH_TOKEN from .env)\n" +
      "  • Or SANITY_API_WRITE_TOKEN with Editor permissions in studio/.env",
  );
  process.exit(1);
}

console.log(`\nDone. Updated ${pending.length} document(s).`);
