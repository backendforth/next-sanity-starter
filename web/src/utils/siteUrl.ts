/**
 * The site's canonical origin, resolved once at module load.
 *
 * Server-only. Everything below `NEXT_PUBLIC_SITE_URL` reads host variables
 * that Next never inlines into the client bundle, so import this from
 * metadata, `robots.ts` and `sitemap.ts` — not from a client component.
 *
 * This exists because the four call sites used to carry their own
 * `process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"`. With the
 * variable unset the placeholder shipped: every canonical, every `hreflang`,
 * `og:url`, `metadataBase` and the sitemap reference in `robots.txt` pointed
 * at example.com, and nothing — typecheck, lint, build, deploy — said a word.
 * The chain below removes the silence: an explicit value wins, the deploy
 * host's own URL catches a missing one, and a deploy that can resolve neither
 * fails loudly instead of publishing a guess.
 */

/** Strip trailing slashes and add a scheme to the bare hosts Vercel exposes. */
function normalizeOrigin(value: string | undefined): string | null {
	const trimmed = value?.trim();
	if (!trimmed) return null;
	const withScheme = /^https?:\/\//.test(trimmed)
		? trimmed
		: `https://${trimmed}`;
	return withScheme.replace(/\/+$/, "");
}

/**
 * Netlify's own view of where this build is served from. Previews and branch
 * deploys resolve to their own origin (`DEPLOY_PRIME_URL`) rather than the
 * production domain, so a preview never claims to be canonical for the live
 * site. The `NETLIFY` guard keeps a stray local `URL` variable out.
 */
function netlifyOrigin(): string | null {
	if (process.env.NETLIFY !== "true") return null;
	if (process.env.CONTEXT === "production") {
		return normalizeOrigin(process.env.URL);
	}
	return (
		normalizeOrigin(process.env.DEPLOY_PRIME_URL) ??
		normalizeOrigin(process.env.URL)
	);
}

/** Same idea on Vercel; both variables are bare hosts, no scheme. */
function vercelOrigin(): string | null {
	if (process.env.VERCEL !== "1") return null;
	if (process.env.VERCEL_ENV === "production") {
		return normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
	}
	return normalizeOrigin(process.env.VERCEL_URL);
}

function resolveSiteBaseUrl(): string {
	/* Explicit wins, and it is the only candidate that is inlined at build
	 * time — so the prerender and every later ISR regeneration agree on it.
	 * Set it (netlify.toml `[context.production.environment]`) on a site with
	 * its own domain; don't rely on the rest. */
	const explicit = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
	if (explicit) return explicit;

	const host = netlifyOrigin() ?? vercelOrigin();
	if (host) return host;

	/* On a deploy host with nothing resolvable, guessing would publish wrong
	 * canonicals to real crawlers — the bug this module exists to prevent. */
	if (process.env.NETLIFY === "true" || process.env.VERCEL === "1") {
		throw new Error(
			"[siteUrl] No site origin resolved on a deploy host. Set " +
				"NEXT_PUBLIC_SITE_URL to the canonical origin (no trailing " +
				"slash) in netlify.toml `[context.production.environment]` or " +
				"the host's build environment.",
		);
	}

	/* Local dev and plain CI smoke builds — nothing is published, so a
	 * localhost origin is the honest answer rather than a fake domain. */
	return "http://localhost:3000";
}

export const SITE_BASE_URL = resolveSiteBaseUrl();
