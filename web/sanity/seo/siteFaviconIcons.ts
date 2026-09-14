import type { Metadata } from "next";

import type { SanityImageField } from "@/sanity/types/modules";
import { buildFetchedImageUrl } from "@/sanity/utils/sanityImageBuilder";

/**
 * Icon sizes derived from the single uploaded asset. 32 is the browser tab,
 * 192 the Android home screen, 180 the iOS home screen. Anything else a
 * consumer wants it can downscale from these.
 */
const ICON_SIZES = [32, 192] as const;
const APPLE_ICON_SIZE = 180;

/**
 * Turns whatever sits in `siteSettings.favicon` into the icon set the browser
 * needs, entirely on the Sanity CDN: square (`fit=crop`, honouring the
 * Studio's crop rect and hotspot), one fixed pixel size per icon, and PNG —
 * `auto=format` would hand back WebP/AVIF, which some icon consumers (older
 * Safari, OS launchers, feed readers) do not decode.
 *
 * What the transform can and cannot do: it guarantees the *shape* — an editor
 * may upload a 3000 px JPEG, a transparent SVG-exported PNG or a PWA icon and
 * the tab still gets a valid 32×32 PNG. It cannot invent legibility. A wide
 * wordmark squashed into 32 px stays unreadable, and the lever for that is the
 * crop in the Studio: crop the source down to the part that should survive
 * (the signet, a single letter) and every size below follows.
 *
 * Returns `undefined` when nothing is set, so `generateMetadata` can fall
 * through to the static icon in `app/`.
 */
export function siteFaviconIcons(
	favicon: SanityImageField | null | undefined,
): Metadata["icons"] | undefined {
	if (!favicon?.asset) return undefined;

	const icon = ICON_SIZES.map((size) => ({
		url: faviconUrl(favicon, size),
		sizes: `${size}x${size}`,
		type: "image/png",
	})).filter((entry): entry is { url: string; sizes: string; type: string } =>
		Boolean(entry.url),
	);
	if (icon.length === 0) return undefined;

	const appleUrl = faviconUrl(favicon, APPLE_ICON_SIZE);
	return {
		icon,
		...(appleUrl
			? {
					apple: [
						{
							url: appleUrl,
							sizes: `${APPLE_ICON_SIZE}x${APPLE_ICON_SIZE}`,
							type: "image/png",
						},
					],
				}
			: {}),
	};
}

/** One square PNG at `size`, cropped to the Studio's crop/hotspot. */
function faviconUrl(favicon: SanityImageField, size: number): string {
	return (
		buildFetchedImageUrl(favicon, {
			width: size,
			height: size,
			fit: "crop",
			format: "png",
		}) ?? ""
	);
}
