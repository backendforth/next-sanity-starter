import {
	fetchSiteAnalyticsSettings,
	fetchSiteChrome,
} from "@/sanity/fetchSanityData";
import { getEnabledTrackers } from "@/src/components/tracking/lib/trackingConfig";
import { SiteTracking } from "@/src/components/tracking/SiteTracking";

export async function SiteTrackingShell() {
	/* Both calls dedupe against the layout's (React `cache`), no extra fetch. */
	const [analytics, chrome] = await Promise.all([
		fetchSiteAnalyticsSettings(),
		fetchSiteChrome(),
	]);
	const cookieBanner = chrome?.cookieBanner ?? null;

	if (getEnabledTrackers(analytics).length === 0) return null;

	return (
		<SiteTracking
			config={{
				analytics,
				cookieBanner,
			}}
		/>
	);
}
