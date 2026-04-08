#!/usr/bin/env node
/**
 * Exports the production dataset to a local tarball, then imports it into the
 * development dataset (replacing documents with the same IDs).
 *
 * Requires: `sanity login` (or SANITY_AUTH_TOKEN) and SANITY_STUDIO_PROJECT_ID in .env
 *
 * Usage: pnpm run sync:prod-to-dev [--yes]
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { loadEnvFile, studioRootFromScript } from "./loadEnvFile.mjs";

const studioRoot = studioRootFromScript(import.meta.url);
const envPath = `${studioRoot}/.env`;
loadEnvFile(envPath);

const args = process.argv.slice(2);
const skipConfirm = args.includes("--yes") || args.includes("-y");

const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim();
const prodDataset =
  process.env.SANITY_STUDIO_DATASET_PRODUCTION?.trim() || "production";
const devDataset =
  process.env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() || "development";

if (!projectId) {
  console.error(
    "Missing SANITY_STUDIO_PROJECT_ID. Set it in studio/.env (see .env.example).",
  );
  process.exit(1);
}

if (prodDataset === devDataset) {
  console.error(
    `Refusing to sync: production and development dataset names are both "${prodDataset}".`,
  );
  process.exit(1);
}

const syncDir = `${studioRoot}/.sync-tmp`;
const exportPath = `${syncDir}/prod-to-dev-export.tar.gz`;

function run(cmd, opts = {}) {
  execSync(cmd, {
    cwd: studioRoot,
    stdio: "inherit",
    env: process.env,
    ...opts,
  });
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  console.log(
    `\n[sanity:sync] Production dataset → local file → development dataset\n  Project: ${projectId}\n  Export from: ${prodDataset}\n  Import into: ${devDataset}\n  Archive: ${exportPath}\n`,
  );

  if (!skipConfirm) {
    const ok = await ask(
      `This replaces documents in "${devDataset}" with data from "${prodDataset}". Continue? [y/N] `,
    );
    if (ok !== "y" && ok !== "yes") {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  if (!existsSync(syncDir)) {
    mkdirSync(syncDir, { recursive: true });
  }

  console.log(`\n→ Exporting "${prodDataset}"…\n`);
  run(
    `pnpm exec sanity datasets export "${prodDataset}" "${exportPath}" --project-id "${projectId}" --overwrite`,
  );

  console.log(`\n→ Importing into "${devDataset}" (with --replace)…\n`);
  run(
    `pnpm exec sanity datasets import -d "${devDataset}" "${exportPath}" --project-id "${projectId}" --replace`,
  );

  console.log(
    `\n[sanity:sync] Done. Development dataset "${devDataset}" now matches the exported snapshot from "${prodDataset}".\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
