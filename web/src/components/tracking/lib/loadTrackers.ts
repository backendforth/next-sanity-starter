import type { AnalyticsTracker } from "@/sanity/types/siteAnalyticsSettings";
import {
	beginTrackerLoad,
	isCurrentTrackerLoad,
	isTrackerLoaded,
	registerLoadedTracker,
} from "@/src/components/tracking/lib/trackingRuntime";

const POSTHOG_INIT_MAX_ATTEMPTS = 40;

function appendScript(
	src: string,
	attributes?: Record<string, string>,
): HTMLScriptElement {
	const script = document.createElement("script");
	script.src = src;
	script.async = true;
	for (const [name, value] of Object.entries(attributes ?? {})) {
		script.setAttribute(name, value);
	}
	document.head.appendChild(script);
	return script;
}

function loadGoogleAnalytics(tracker: AnalyticsTracker): void {
	if (tracker._type !== "trackerGoogleAnalytics") return;
	const id = tracker.measurementId?.trim();
	if (!id || isTrackerLoaded(tracker._key)) return;

	// A previous withdrawal set `ga-disable-<id>` on window, and that outlives the
	// script — without clearing it, re-granting consent loads a disabled GA.
	(window as unknown as Record<string, boolean | undefined>)[
		`ga-disable-${id}`
	] = false;

	const gtag = (
		window as Window & {
			gtag?: (...args: unknown[]) => void;
		}
	).gtag;
	if (gtag) {
		registerLoadedTracker(tracker);
		return;
	}

	appendScript(
		`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`,
	);

	const inline = document.createElement("script");
	const cookieFree = tracker.cookieFree === true;
	inline.textContent = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(id)}, ${cookieFree ? "{ client_storage: 'none', anonymize_ip: true }" : "{}"});
`;
	document.head.appendChild(inline);
	registerLoadedTracker(tracker);
}

function loadMatomo(tracker: AnalyticsTracker): void {
	if (tracker._type !== "trackerMatomo") return;
	const baseUrl = tracker.url?.trim();
	const siteId = tracker.siteId?.trim();
	if (!baseUrl || !siteId || isTrackerLoaded(tracker._key)) return;

	const normalizedUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
	const cookieFree = tracker.cookieFree === true;

	const _paq = (
		window as Window & {
			_paq?: unknown[][];
		}
	)._paq;
	if (_paq) {
		_paq.push(["forgetUserOptOut"]);
		if (cookieFree) _paq.push(["disableCookies"]);
		registerLoadedTracker(tracker);
		return;
	}

	const inline = document.createElement("script");
	inline.textContent = `
var _paq = window._paq = window._paq || [];
_paq.push(['forgetUserOptOut']);
${cookieFree ? "_paq.push(['disableCookies']);" : ""}
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
  var u=${JSON.stringify(normalizedUrl)};
  _paq.push(['setTrackerUrl', u+'matomo.php']);
  _paq.push(['setSiteId', ${JSON.stringify(siteId)}]);
  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
  g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
})();
`;
	document.head.appendChild(inline);
	registerLoadedTracker(tracker);
}

function loadMicrosoftClarity(tracker: AnalyticsTracker): void {
	if (tracker._type !== "trackerMicrosoftClarity") return;
	const projectId = tracker.projectId?.trim();
	if (!projectId || isTrackerLoaded(tracker._key)) return;

	const inline = document.createElement("script");
	inline.textContent = `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", ${JSON.stringify(projectId)});
`;
	document.head.appendChild(inline);
	registerLoadedTracker(tracker);
}

/**
 * PostHog Cloud serves the SDK from a separate assets host — the ingest host
 * has no `/static/array.js`, so the default EU config would never load. Only
 * the two known cloud hosts are rewritten; self-hosted instances serve both
 * from the same origin and are left alone.
 */
function posthogAssetHost(apiHost: string): string {
	return apiHost
		.replace(/\/$/, "")
		.replace(
			/^(https?:\/\/)(us|eu)\.i\.posthog\.com$/i,
			"$1$2-assets.i.posthog.com",
		);
}

function loadPostHog(tracker: AnalyticsTracker): void {
	if (tracker._type !== "trackerPostHog") return;
	const apiKey = tracker.apiKey?.trim();
	const apiHost = tracker.apiHost?.trim();
	if (!apiKey || !apiHost || isTrackerLoaded(tracker._key)) return;

	const cookieFree = tracker.cookieFree === true;

	const existingPostHog = (
		window as Window & {
			posthog?: {
				capture?: (event: string) => void;
				opt_in_capturing?: () => void;
			};
		}
	).posthog;
	if (existingPostHog?.capture) {
		existingPostHog.opt_in_capturing?.();
		registerLoadedTracker(tracker);
		return;
	}

	const generation = beginTrackerLoad(tracker._key);
	const script = appendScript(`${posthogAssetHost(apiHost)}/static/array.js`);

	let attempts = 0;
	const tryInit = () => {
		// Consent can be withdrawn while the script or the retry timer is still in
		// flight; without this the pending callback initialises PostHog *after* the
		// withdrawal and starts collecting again.
		if (!isCurrentTrackerLoad(tracker._key, generation)) return;
		// tryInit runs immediately, on script load, and on a retry timer — without
		// this the pending timer re-initialises after the load handler succeeded.
		if (isTrackerLoaded(tracker._key)) return;
		attempts += 1;
		const posthog = (
			window as Window & {
				posthog?: {
					init?: (
						key: string,
						options: { api_host: string; persistence: string },
					) => void;
					opt_in_capturing?: () => void;
				};
			}
		).posthog;
		if (posthog?.init) {
			posthog.init(apiKey, {
				api_host: apiHost,
				persistence: cookieFree ? "memory" : "localStorage+cookie",
			});
			// A previous withdrawal's `opt_out_capturing` persists in storage, so
			// without this a re-grant would init an opted-out instance.
			posthog.opt_in_capturing?.();
			registerLoadedTracker(tracker);
			return;
		}
		if (attempts < POSTHOG_INIT_MAX_ATTEMPTS) {
			window.setTimeout(tryInit, 50);
		}
	};

	script.addEventListener("load", tryInit);
	script.addEventListener("error", () => {
		console.warn("[PostHog] Failed to load analytics script.");
	});
	tryInit();
}

function loadPlausible(tracker: AnalyticsTracker): void {
	if (tracker._type !== "trackerPlausible") return;
	const domain = tracker.domain?.trim();
	const scriptUrl = tracker.scriptUrl?.trim();
	if (!domain || !scriptUrl || isTrackerLoaded(tracker._key)) return;

	appendScript(scriptUrl, {
		defer: "",
		"data-domain": domain,
	});
	registerLoadedTracker(tracker);
}

const loaders: Record<
	AnalyticsTracker["_type"],
	(tracker: AnalyticsTracker) => void
> = {
	trackerGoogleAnalytics: loadGoogleAnalytics,
	trackerMatomo: loadMatomo,
	trackerMicrosoftClarity: loadMicrosoftClarity,
	trackerPostHog: loadPostHog,
	trackerPlausible: loadPlausible,
};

export function loadTracker(tracker: AnalyticsTracker): void {
	const loader = loaders[tracker._type];
	if (loader) loader(tracker);
}

export function loadTrackers(trackers: AnalyticsTracker[]): void {
	for (const tracker of trackers) {
		loadTracker(tracker);
	}
}
