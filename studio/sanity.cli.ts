import { resolveStudioDatasetAsync } from "@repo/sanity-dataset-resolve";
import { defineCliConfig } from "sanity/cli";

/**
 * The Studio build inlines every `SANITY_STUDIO_*` variable into the public bundle (`sanity
 * build` lists them as it goes), so a token or secret under that prefix ships to everyone who
 * can load the Studio. Commands that bundle fail on one; the rest only warn. Secrets belong
 * under unprefixed names: `MUX_TOKEN_*`, `SANITY_AUTH_TOKEN`.
 */
function assertNoSecretsInPublicEnv(): void {
  const names = Object.keys(process.env).filter(
    (name) =>
      /^SANITY_STUDIO_\w*(TOKEN|SECRET|PASSWORD)/.test(name) &&
      Boolean(process.env[name]?.trim()),
  );
  if (names.length === 0) return;

  // The first non-option argument, so an option placed before the command can't hide it.
  const command = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
  const bundles =
    command === "build" ||
    (command === "deploy" &&
      !process.argv.includes("--external") &&
      !process.argv.includes("--no-build"));
  const message = `${names.join(", ")} would ship in the public Studio bundle, which inlines every SANITY_STUDIO_* variable. Rename or unset it (see studio/.env.example).`;
  if (bundles) {
    throw new Error(message);
  }
  console.warn(`[env] ${message}`);
}

assertNoSecretsInPublicEnv();

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;

/**
 * The dataset, resolved once per CLI run with the whole Node env, so the host's build context
 * counts the way it does for the web build (`web/next.config.ts`): a Netlify or Vercel
 * production build prefers `production`, everything else `development`, and
 * `SANITY_STUDIO_DATASET` overrides both — on Netlify per site and deploy context. Written back
 * to `SANITY_STUDIO_DATASET`, which `sanity build`, `sanity deploy` and `sanity dev` inline, so
 * the Studio in the browser starts with the name instead of resolving it.
 */
const dataset = await resolveStudioDatasetAsync(process.env);
process.env.SANITY_STUDIO_DATASET = dataset;

/**
 * Sanity-hosted deployment (`*.sanity.studio`), so `pnpm studio:deploy` updates the existing
 * deployment instead of prompting for a hostname. The id belongs to one Sanity project — forks
 * have their own — so it comes from the env, never from source. `sanity deploy` prints it after
 * the first deploy; it is also listed under the project's Studios in sanity.io/manage.
 *
 * The default hosting, Netlify (`studio/netlify.toml`), doesn't use it: `pnpm studio:register`
 * clears it so the external URL is registered as its own Studio.
 */
const appId = process.env.SANITY_STUDIO_APP_ID?.trim();

export default defineCliConfig({
  api: {
    projectId: projectId ?? "",
    dataset,
  },
  ...(appId ? { deployment: { appId } } : {}),
});
