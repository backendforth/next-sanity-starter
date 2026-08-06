import {
	fetchSiteAnalyticsSettings,
	fetchSiteCookieBanner,
} from "@/sanity/fetchSanityData";
import { getEnabledTrackers } from "@/src/components/tracking/lib/trackingConfig";
import { SiteTracking } from "@/src/components/tracking/SiteTracking";

export async function SiteTrackingShell() {
	const [analytics, cookieBanner] = await Promise.all([
		fetchSiteAnalyticsSettings(),
		fetchSiteCookieBanner(),
	]);

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
