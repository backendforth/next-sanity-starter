import { resolveStudioDatasetAsync } from "@repo/sanity-dataset-resolve";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

function originOf(raw: string | undefined): string | null {
	if (!raw?.trim()) return null;
	try {
		return new URL(raw.trim()).origin;
	} catch {
		return null;
	}
}

/**
 * Origin of the hosted Studio, for `frame-ancestors` — Sanity Presentation
 * embeds this site in an iframe on the Studio domain. `*.sanity.studio` and
 * the local Studio are always allowed; a custom Studio domain is picked up
 * from `NEXT_PUBLIC_SANITY_STUDIO_URL` (the same variable the Sanity client
 * uses for stega links).
 */
const studioOrigin = originOf(process.env.NEXT_PUBLIC_SANITY_STUDIO_URL);

/**
 * Self-hosted analytics (Matomo, Plausible, PostHog), comma-separated origins
 * in `CSP_ANALYTICS_ORIGINS`. The tracker URLs live in Sanity, but `headers()`
 * is resolved at build time, so their hosts have to come in through the
 * environment — a change needs a redeploy.
 */
const selfHostedAnalyticsOrigins = (process.env.CSP_ANALYTICS_ORIGINS ?? "")
	.split(",")
	.map((value) => originOf(value))
	.filter((origin): origin is string => origin !== null);

/**
 * Cloud hosts of the providers `siteAnalyticsSettings` can enable. Allowed
 * whether a tracker is enabled or not: the policy is static, and the trackers
 * are not.
 * - Google Analytics 4: `*.googletagmanager.com` serves gtag.js and, with
 *   `*.google-analytics.com` / `*.analytics.google.com`, takes the hits.
 * - Microsoft Clarity: the tag on `www.clarity.ms` pulls the recorder from
 *   `scripts.clarity.ms` and reports to other `*.clarity.ms` hosts and
 *   `c.bing.com`.
 * - PostHog Cloud: the SDK comes from `eu|us-assets.i.posthog.com`, the
 *   ingest is `eu|us.i.posthog.com`.
 * - Plausible Cloud: script and events on `plausible.io`.
 */
const analyticsSources = {
	script: [
		"https://*.googletagmanager.com",
		"https://*.clarity.ms",
		"https://*.posthog.com",
		"https://plausible.io",
		...selfHostedAnalyticsOrigins,
	],
	connect: [
		"https://*.google-analytics.com",
		"https://*.analytics.google.com",
		"https://*.googletagmanager.com",
		"https://*.clarity.ms",
		"https://c.bing.com",
		"https://*.posthog.com",
		"https://plausible.io",
		...selfHostedAnalyticsOrigins,
	],
	img: [
		"https://*.google-analytics.com",
		"https://*.googletagmanager.com",
		"https://*.clarity.ms",
		"https://c.bing.com",
		...selfHostedAnalyticsOrigins,
	],
};

/**
 * Content-Security-Policy for every response — HTML documents included.
 *
 * Lives here, not in `netlify.toml`: Netlify's `[[headers]]` rules only
 * reach files served straight from its CDN (`/_next/static/*`), never the
 * SSR/ISR HTML that comes out of the Next.js function — so a policy declared
 * there never governed the document. `headers()` is applied by the Next
 * server itself and travels with the app on any host.
 *
 * Directive notes:
 * - `script-src 'unsafe-inline'`: the synchronous boot script in
 *   `DocumentShell.tsx` must run before first paint, and the Google Analytics
 *   loader is an injected inline script. To drop it, hash the boot script
 *   (`'sha256-…'`) and move the GA snippet to a file. `'unsafe-eval'` is
 *   development-only (Next dev runtime + source maps).
 * - Mux is allowed as `https://*.mux.com`, not `stream.mux.com` alone:
 *   `stream.mux.com/<id>.m3u8` only serves the master playlist — rendition
 *   playlists and segments come from rotating CDN hosts. `www.gstatic.com`
 *   is the Chromecast sender SDK behind Mux Player's cast button. Mux Data
 *   (`*.litix.io`) is not allowed because `MediaVideo` sets
 *   `disableTracking`; add it if a project turns that back on.
 * - `media-src`: Safari native HLS sets `video.src` to `stream.mux.com`,
 *   hls.js plays through MSE `blob:` URLs. Without this directive
 *   `default-src 'self'` would block both.
 * - `worker-src blob:`: hls.js transmuxing worker.
 * - `connect-src`: Sanity API + CDN (GROQ, Live, Visual Editing), Mux
 *   manifests/segments/thumbnails, analytics, and the dev server's HMR
 *   websocket.
 * - `frame-ancestors` must stay a header (a `<meta>` CSP cannot carry it):
 *   it is what lets Sanity Presentation embed the site.
 */
function contentSecurityPolicy(): string {
	const directives: Record<string, string[]> = {
		"default-src": ["'self'"],
		"base-uri": ["'self'"],
		"form-action": ["'self'"],
		"object-src": ["'none'"],
		"img-src": [
			"'self'",
			"data:",
			"blob:",
			"https://cdn.sanity.io",
			"https://*.mux.com",
			...analyticsSources.img,
		],
		"media-src": ["'self'", "blob:", "https://*.mux.com"],
		"font-src": ["'self'", "data:"],
		"style-src": ["'self'", "'unsafe-inline'"],
		"script-src": [
			"'self'",
			"'unsafe-inline'",
			/* The cast SDK pulls its framework in protocol-relative, so on the
			 * http dev origin that turns into plain http — allowed there only. */
			"https://www.gstatic.com",
			...analyticsSources.script,
			...(isDev ? ["http://www.gstatic.com", "'unsafe-eval'"] : []),
		],
		"connect-src": [
			"'self'",
			"https://*.api.sanity.io",
			"https://*.apicdn.sanity.io",
			"https://*.mux.com",
			...analyticsSources.connect,
			...(isDev ? ["ws://localhost:*", "wss://localhost:*"] : []),
		],
		"frame-src": [
			"'self'",
			"https://*.mux.com",
			"https://*.sanity.studio",
			/* Netlify injects its collaboration drawer into deploy previews as an
			 * `app.netlify.com` iframe. `CONTEXT` is Netlify's build context. */
			...(process.env.CONTEXT === "deploy-preview"
				? ["https://app.netlify.com"]
				: []),
		],
		"frame-ancestors": [
			"'self'",
			"http://localhost:3333",
			"https://*.sanity.studio",
			...(studioOrigin ? [studioOrigin] : []),
		],
		"worker-src": ["'self'", "blob:"],
	};
	return Object.entries(directives)
		.map(([name, values]) => `${name} ${values.join(" ")}`)
		.join("; ");
}

/**
 * Baseline security headers, emitted on every route (documents, ISR, static).
 * `X-Frame-Options` is deliberately absent: it would deny the Sanity
 * Presentation iframe, and `frame-ancestors` above supersedes it anyway.
 */
const securityHeaders = [
	{ key: "Content-Security-Policy", value: contentSecurityPolicy() },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
	},
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
];

// App Router: no `next.config` i18n. Site locales come from Sanity (`siteLanguageSettings`), not from here.
// Use the same `SANITY_STUDIO_PROJECT_ID` / dataset env as `studio/.env` so web + Studio hit one dataset.
const nextConfig: NextConfig = {
	/** Drop the `X-Powered-By: Next.js` header — small fingerprinting reduction. */
	poweredByHeader: false,

	/** Security headers on every path — see {@link contentSecurityPolicy}. */
	async headers() {
		return [{ source: "/:path*", headers: securityHeaders }];
	},

	/** Default in Next 16; pinned explicitly to make the starter's choice obvious. */
	reactStrictMode: true,

	experimental: {
		/** Client router cache for prefetched static segments (seconds). */
		staleTimes: {
			static: 180,
			dynamic: 30,
		},
	},

	compiler: {
		removeConsole:
			process.env.NODE_ENV === "production"
				? { exclude: ["error", "warn"] }
				: false,
	},
};

/**
 * Inline `SANITY_STUDIO_*` into every bundle: server, proxy and client.
 *
 * Next normally only exposes `NEXT_PUBLIC_*` variables to the browser. We keep a single
 * env-var name across `web/` and `studio/` by listing them here — `next.config`'s `env` map
 * gets statically replaced at build time exactly like `NEXT_PUBLIC_*`. The dataset is resolved
 * once, here (`@repo/sanity-dataset-resolve`), so GROQ queries and image URLs read the same
 * one, and SSR and CSR build identical image URLs (no hydration mismatch).
 */
export default async function config(): Promise<NextConfig> {
	return {
		...nextConfig,
		env: {
			SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID ?? "",
			SANITY_STUDIO_DATASET: await resolveStudioDatasetAsync(process.env),
		},
	};
}
