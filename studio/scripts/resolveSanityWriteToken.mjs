import { execSync } from "node:child_process";

/**
 * Token for dataset mutations. Avoids `SANITY_AUTH_TOKEN` / `SANITY_API_READ_TOKEN`
 * from `.env` — those are usually read-only web tokens and block writes even after
 * `sanity login`.
 */
export function resolveSanityWriteToken(studioRoot) {
  const explicit =
    process.env.SANITY_API_WRITE_TOKEN?.trim() ||
    process.env.SANITY_MIGRATION_TOKEN?.trim();
  if (explicit) {
    return {
      token: explicit,
      source: "SANITY_API_WRITE_TOKEN or SANITY_MIGRATION_TOKEN",
    };
  }

  const envForCli = { ...process.env };
  delete envForCli.SANITY_AUTH_TOKEN;
  delete envForCli.SANITY_API_READ_TOKEN;

  try {
    const output = execSync("pnpm exec sanity debug --secrets", {
      cwd: studioRoot,
      encoding: "utf8",
      env: envForCli,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const match = output.match(/Auth token:\s*(\S+)/);
    const token = match?.[1]?.trim();
    if (token) {
      return { token, source: "sanity login (CLI session)" };
    }
  } catch {
    // fall through
  }

  return { token: undefined, source: null };
}
