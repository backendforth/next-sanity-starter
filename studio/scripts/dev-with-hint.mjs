#!/usr/bin/env node
/**
 * Prints a one-time hint about syncing production → development, then runs `sanity dev`.
 */

import { spawn } from "node:child_process";
import { studioRootFromScript } from "./loadEnvFile.mjs";

const studioRoot = studioRootFromScript(import.meta.url);

const hint = `
\x1b[36m[sanity]\x1b[0m To copy \x1b[1mproduction → development\x1b[0m dataset locally (manual, when you need it):
  \x1b[1mpnpm run sync:prod-to-dev\x1b[0m
  From repo root: \x1b[1mpnpm studio:sync-prod-to-dev\x1b[0m (or \x1b[1mpnpm --filter studio sync:prod-to-dev\x1b[0m)
  (requires \x1b[1msanity login\x1b[0m and \x1b[1mSANITY_STUDIO_PROJECT_ID\x1b[0m in studio/.env — see scripts/README.md)
`;

console.log(hint);

const child = spawn("pnpm", ["exec", "sanity", "dev"], {
  cwd: studioRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
});

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
