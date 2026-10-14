#!/usr/bin/env node
/**
 * One-off migration: disable static MP4 on existing Mux assets and list assets
 * that still use premium / 2160p encoding (re-upload or Mux dashboard re-encode).
 *
 * Requires in studio/.env:
 *   MUX_TOKEN_ID=
 *   MUX_TOKEN_SECRET=
 *
 * Usage:
 *   node scripts/mux-migrate-assets.mjs           # dry-run (default)
 *   node scripts/mux-migrate-assets.mjs --apply     # PUT mp4_support=none
 */

import { loadEnvFile, studioRootFromScript } from "./loadEnvFile.mjs";

const root = studioRootFromScript(import.meta.url);
loadEnvFile(`${root}/.env`);

// The old `SANITY_STUDIO_MUX_*` names still work here, but the Studio build inlines every
// `SANITY_STUDIO_*` variable into its public bundle, so `sanity build` now refuses them.
const legacyTokenId = process.env.SANITY_STUDIO_MUX_TOKEN_ID;
const legacyTokenSecret = process.env.SANITY_STUDIO_MUX_TOKEN_SECRET;
const tokenId = process.env.MUX_TOKEN_ID || legacyTokenId;
const tokenSecret = process.env.MUX_TOKEN_SECRET || legacyTokenSecret;
const apply = process.argv.includes("--apply");

if (legacyTokenId || legacyTokenSecret) {
  console.warn(
    "SANITY_STUDIO_MUX_TOKEN_ID / _SECRET are deprecated: rename them to MUX_TOKEN_ID / MUX_TOKEN_SECRET in studio/.env. Any SANITY_STUDIO_* value ships in the public Studio bundle.",
  );
}

if (!tokenId || !tokenSecret) {
  console.error("Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET in studio/.env");
  process.exit(1);
}

const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64");

async function muxFetch(path, init = {}) {
  const res = await fetch(`https://api.mux.com${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function listAllAssets() {
  const assets = [];
  let page = 1;
  for (;;) {
    const json = await muxFetch(`/video/v1/assets?limit=100&page=${page}`);
    const batch = json?.data ?? [];
    assets.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return assets;
}

async function disableMp4(assetId) {
  return muxFetch(`/video/v1/assets/${assetId}/mp4-support`, {
    method: "PUT",
    body: JSON.stringify({ mp4_support: "none" }),
  });
}

const assets = await listAllAssets();
console.log(`Found ${assets.length} Mux asset(s)\n`);

const needsReencode = [];
const needsMp4Off = [];

for (const asset of assets) {
  const id = asset.id;
  const mp4 = asset.mp4_support ?? "none";
  const tier = asset.max_resolution_tier ?? asset.resolution_tier ?? "?";
  const quality = asset.video_quality ?? asset.encoding_tier ?? "?";

  if (mp4 !== "none") {
    needsMp4Off.push({ id, mp4 });
  }
  if (tier === "2160p" || quality === "premium") {
    needsReencode.push({ id, tier, quality, mp4 });
  }
}

if (needsMp4Off.length === 0) {
  console.log("All assets already have mp4_support=none.");
} else {
  console.log(`${needsMp4Off.length} asset(s) with static MP4 enabled:`);
  for (const { id, mp4 } of needsMp4Off) {
    console.log(`  ${id}  mp4_support=${mp4}`);
    if (apply) {
      await disableMp4(id);
      console.log(`    → set mp4_support=none`);
    }
  }
  if (!apply) {
    console.log("\nDry-run. Pass --apply to disable MP4 on these assets.");
  }
}

if (needsReencode.length > 0) {
  console.log(
    `\n${needsReencode.length} asset(s) may need re-upload for plus / 1440p ladder:`,
  );
  for (const { id, tier, quality, mp4 } of needsReencode) {
    console.log(`  ${id}  tier=${tier}  quality=${quality}  mp4=${mp4}`);
  }
  console.log(
    "\nMux does not re-encode in place. Re-upload in Sanity Studio or replace the asset in the Mux dashboard.",
  );
} else {
  console.log("\nNo assets flagged for premium/2160p re-encode.");
}
