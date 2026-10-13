import {
	fetchSiteAnalyticsSettings,
	fetchSiteCookieBanner,
} from "@/sanity/fetchSanityData";
import { getEnabledTrackers } from "@/src/components/tracking/lib/trackingConfig";
import { SiteTracking } from "@/src/components/tracking/SiteTracking";

/** `locale` picks the cookie-banner document — one per language on this branch. */
export async function SiteTrackingShell({ locale }: { locale: string }) {
	const [analytics, cookieBanner] = await Promise.all([
		fetchSiteAnalyticsSettings(),
		fetchSiteCookieBanner(locale),
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
