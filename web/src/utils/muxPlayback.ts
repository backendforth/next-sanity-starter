/** Mux asset / `mediaQuery` video payload from Sanity — resolve `playbackId` and display size. */

export function extractMuxPlaybackId(media: unknown): string | null {
	if (!media || typeof media !== "object") return null;
	const m = media as Record<string, unknown>;
	if (typeof m.playbackId === "string" && m.playbackId.length > 0) {
		return m.playbackId;
	}
	const asset = m.asset;
	if (!asset || typeof asset !== "object") return null;
	const a = asset as Record<string, unknown>;
	if (typeof a.playbackId === "string" && a.playbackId.length > 0) {
		return a.playbackId;
	}
	const data = a.data;
	if (!data || typeof data !== "object") return null;
	const d = data as Record<string, unknown>;
	if (typeof d.playbackId === "string" && d.playbackId.length > 0) {
		return d.playbackId;
	}
	const ids = d.playback_ids;
	if (Array.isArray(ids) && ids[0] && typeof ids[0] === "object") {
		const id = (ids[0] as { id?: string }).id;
		if (typeof id === "string" && id.length > 0) return id;
	}
	return null;
}

/**
 * `image.mux.com` thumbnail as WebP — about a third of the JPG's bytes. Mux delivers both
 * untagged (no ICC profile), so the browser treats both as sRGB and the format cannot shift
 * colour. `widthPx` is CSS pixels; Mux downscales from source. Callers cap it to retina ×
 * container.
 */
export function muxThumbnailUrl(
	playbackId: string,
	timeSec: number,
	widthPx: number,
): string {
	const u = new URL(`https://image.mux.com/${playbackId}/thumbnail.webp`);
	u.searchParams.set("time", String(timeSec));
	if (widthPx > 0) {
		u.searchParams.set("width", String(Math.round(widthPx)));
	}
	return u.toString();
}

/**
 * Pixel width for `image.mux.com` thumbnails: ~2× layout width, capped by the source asset and
 * the Mux practical upper bound (3840). Falls back to 1280 when the container width is unknown.
 */
export function muxThumbnailRequestWidthPx(args: {
	containerWidthPx: number | undefined;
	assetMaxWidthPx: number | undefined;
}): number {
	const assetCap =
		args.assetMaxWidthPx && args.assetMaxWidthPx > 0
			? args.assetMaxWidthPx
			: 3840;
	const base =
		typeof args.containerWidthPx === "number" && args.containerWidthPx > 0
			? args.containerWidthPx
			: 1280;
	const retina = Math.ceil(base * 2);
	return Math.min(3840, assetCap, retina);
}

/**
 * Prefer Mux `asset.data.tracks` video dimensions; otherwise `isFallback` + 16:9 for `aspect-ratio`.
 */
export function getMuxDisplayDimensions(media: unknown): {
	width: number;
	height: number;
	isFallback: boolean;
} {
	const fallback = { width: 16, height: 9, isFallback: true as const };
	if (!media || typeof media !== "object") {
		return fallback;
	}
	const m = media as Record<string, unknown>;
	const asset = m.asset;
	if (!asset || typeof asset !== "object") {
		return fallback;
	}
	const data = (asset as Record<string, unknown>).data;
	if (!data || typeof data !== "object") {
		return fallback;
	}
	const tracks = (data as Record<string, unknown>).tracks;
	if (!Array.isArray(tracks)) {
		return fallback;
	}
	for (const t of tracks) {
		if (!t || typeof t !== "object") continue;
		const tr = t as { type?: string; max_width?: number; max_height?: number };
		if (tr.type !== "video") continue;
		if (
			typeof tr.max_width === "number" &&
			typeof tr.max_height === "number" &&
			tr.max_width > 0 &&
			tr.max_height > 0
		) {
			return {
				width: tr.max_width,
				height: tr.max_height,
				isFallback: false,
			};
		}
	}
	return fallback;
}

/** Mux HLS rendition tier identifiers usable with `min_resolution_tier` / `max_resolution_tier`. */
export type MuxResolutionTier =
	| "240p"
	| "270p"
	| "360p"
	| "480p"
	| "540p"
	| "720p"
	| "1080p"
	| "1440p"
	| "2160p";

/**
 * DPR cap for tier selection (loops and the full player). 2.0 honors retina (effective 2× CSS
 * pixels) so a 1920×1080 retina hero targets 2160p; phones with DPR=3 are clamped to 2× so
 * they don't pull 4K just because the OS reports a high density screen.
 */
const LOOP_VIDEO_DPR_CAP = 2.0;

/**
 * Hard manifest ceiling for all site playback (loops and the full player). What a visitor
 * actually gets is capped by the asset's encoding ladder, which Studio sets per field
 * (`max_resolution_tier` on `media.video` / `media.videoLoop`) — encoding is the one knob,
 * this ceiling only keeps the web side from cutting the ladder short.
 */
export const MUX_PLAYBACK_MAX_TIER = "2160p" satisfies MuxResolutionTier;

/**
 * Desktop-class display query: a fine pointer that can hover means a laptop/desktop panel
 * viewed at arm's length, where upscaling one rung is visible.
 */
const FINE_POINTER_DISPLAY_QUERY = "(hover: hover) and (pointer: fine)";

/** Poster width cap — hero loops; `srcset` tops out here (still retina-sharp at ~1 MB WebP). */
export const LOOP_POSTER_MAX_WIDTH_PX = 1920;

const TIER_RANK: Record<MuxResolutionTier, number> = {
	"270p": 0,
	"360p": 1,
	"480p": 2,
	"540p": 3,
	"720p": 4,
	"1080p": 5,
	"1440p": 6,
	"2160p": 7,
	"240p": 0,
};

/** Rank → tier, aligned with {@link TIER_RANK}. */
const TIER_LADDER: readonly MuxResolutionTier[] = [
	"270p",
	"360p",
	"480p",
	"540p",
	"720p",
	"1080p",
	"1440p",
	"2160p",
];

/** A stall rescue never steps below this rung — the visual cliff for a full-width video. */
const TIER_BELOW_FLOOR: MuxResolutionTier = "720p";

/** One rung below `tier`; a tier at or below {@link TIER_BELOW_FLOOR} is returned unchanged. */
export function muxTierBelow(tier: MuxResolutionTier): MuxResolutionTier {
	if (TIER_RANK[tier] <= TIER_RANK[TIER_BELOW_FLOOR]) return tier;
	return TIER_LADDER[TIER_RANK[tier] - 1] ?? tier;
}

/** The lower of two tiers. */
function minResolutionTier(
	a: MuxResolutionTier,
	b: MuxResolutionTier,
): MuxResolutionTier {
	return TIER_RANK[a] <= TIER_RANK[b] ? a : b;
}

/** Target pixels + Mux tier for loop playback (DPR-capped, {@link MUX_PLAYBACK_MAX_TIER} ceiling). */
export function computeLoopVideoTarget(args: {
	containerWidthPx: number;
	containerHeightPx: number;
	devicePixelRatio?: number;
	videoWidthPx: number;
	videoHeightPx: number;
	/** Pick the covering tier (round up) instead of the floor — see {@link isFinePointerDisplay}. */
	roundTierUp?: boolean;
}): { targetW: number; targetH: number; maxResolutionTier: MuxResolutionTier } {
	const rawDpr =
		typeof args.devicePixelRatio === "number" && args.devicePixelRatio > 0
			? args.devicePixelRatio
			: 1;
	const dpr = Math.min(rawDpr, LOOP_VIDEO_DPR_CAP);
	const { targetW, targetH } = computeObjectCoverTargetPx({
		...args,
		devicePixelRatio: dpr,
	});
	const tier = minResolutionTier(
		args.roundTierUp
			? muxCoveringResolutionTierFromHeight(targetH)
			: muxResolutionTierFromHeight(targetH),
		MUX_PLAYBACK_MAX_TIER,
	);
	return { targetW, targetH, maxResolutionTier: tier };
}

/**
 * Largest Mux `*_resolution` tier ≤ `heightPx` (round DOWN — the rendition may be upscaled by up
 * to one rung). Used on touch displays, where the pixel density hides a one-rung upscale and
 * cellular data is precious; desktop-class displays use
 * {@link muxCoveringResolutionTierFromHeight}.
 */
function muxResolutionTierFromHeight(heightPx: number): MuxResolutionTier {
	if (heightPx >= 2160) return "2160p";
	if (heightPx >= 1440) return "1440p";
	if (heightPx >= 1080) return "1080p";
	if (heightPx >= 720) return "720p";
	if (heightPx >= 540) return "540p";
	if (heightPx >= 480) return "480p";
	if (heightPx >= 360) return "360p";
	return "270p";
}

/**
 * Smallest Mux `*_resolution` tier ≥ `heightPx` (round UP, capped at 2160p) — the rendition
 * fully covers the target and is only ever downscaled. With browser chrome, nearly every laptop
 * viewport lands between two rungs (a DPR-2 MacBook hero needs ~1700–2000 px), so the floor
 * mapper served one rung below the display there.
 */
function muxCoveringResolutionTierFromHeight(
	heightPx: number,
): MuxResolutionTier {
	if (heightPx <= 270) return "270p";
	if (heightPx <= 360) return "360p";
	if (heightPx <= 480) return "480p";
	if (heightPx <= 540) return "540p";
	if (heightPx <= 720) return "720p";
	if (heightPx <= 1080) return "1080p";
	if (heightPx <= 1440) return "1440p";
	return "2160p";
}

/**
 * Desktop-class display check for tier rounding: those displays get the covering tier
 * (upscaling is visible at arm's length), touch displays keep the floor tier (invisible at
 * phone pixel density, and one rung can double the bitrate over cellular). SSR-safe: `false`.
 */
function isFinePointerDisplay(): boolean {
	if (typeof window === "undefined" || !window.matchMedia) return false;
	return window.matchMedia(FINE_POINTER_DISPLAY_QUERY).matches;
}

/**
 * Minimum source pixels for `object-fit: cover` — only the constraining axis matters,
 * unlike using `width×DPR` and `height×DPR` independently (which over-estimates and pulls 4K).
 */
function computeObjectCoverTargetPx(args: {
	containerWidthPx: number;
	containerHeightPx: number;
	devicePixelRatio?: number;
	videoWidthPx: number;
	videoHeightPx: number;
}): { targetW: number; targetH: number } {
	const dpr = args.devicePixelRatio ?? 1;
	const cw = args.containerWidthPx * dpr;
	const ch = args.containerHeightPx * dpr;
	const vw = args.videoWidthPx;
	const vh = args.videoHeightPx;
	if (cw <= 0 || ch <= 0 || vw <= 0 || vh <= 0) {
		return { targetW: cw, targetH: ch };
	}
	const videoAspect = vw / vh;
	const containerAspect = cw / ch;
	if (videoAspect > containerAspect) {
		return { targetW: ch * videoAspect, targetH: ch };
	}
	return { targetW: cw, targetH: cw / videoAspect };
}

/**
 * Network-aware ceiling derived from the Network Information API.
 *
 * Only Chromium-family browsers expose `navigator.connection`; Safari and
 * Firefox return `undefined`, and we then fall back to the hard ceiling
 * ({@link MUX_PLAYBACK_MAX_TIER}) so the container-size signal alone decides
 * the tier — i.e. on Safari we **assume a good connection** rather than
 * pessimise. Users on bad connections + Safari + a large screen will see
 * the loop stall instead of degrade; accepted trade-off.
 *
 * Only `saveData` (the explicit user opt-in to data-frugality) and the
 * `effectiveType` cellular buckets are honoured. `downlink` is deliberately
 * **ignored**: Chrome's estimate decays toward ~1.5 Mbps on idle connections
 * and is capped at 10 Mbps (fingerprinting mitigation), so on real fiber
 * lines it routinely reported < 2 Mbps and pinned fullscreen heroes to 720p.
 * Genuinely slow lines are caught by the stall rescues instead: `MediaVideo`
 * unpins its resolution, `MediaVideoLoop` steps its pinned tier down
 * ({@link muxTierBelow}).
 */
function getNetworkAwareTierCeiling(): MuxResolutionTier {
	if (typeof navigator === "undefined") return MUX_PLAYBACK_MAX_TIER;
	type NetworkInformation = {
		effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
		saveData?: boolean;
	};
	const conn = (navigator as Navigator & { connection?: NetworkInformation })
		.connection;
	if (!conn) return MUX_PLAYBACK_MAX_TIER;

	if (conn.saveData === true) return "720p";

	const eff = conn.effectiveType;
	if (eff === "slow-2g" || eff === "2g") return "480p";
	if (eff === "3g") return "720p";

	return MUX_PLAYBACK_MAX_TIER;
}

/**
 * HLS URL tuned for silent loops: container-aware tier (DPR-capped, up to
 * {@link MUX_PLAYBACK_MAX_TIER}) combined with a network-aware ceiling, then
 * pinned as both min and max in the manifest so ABR has nothing to ramp through.
 *
 * Why a single-tier manifest: Safari's native HLS picks conservatively from
 * the lowest available rendition and ramps up over several segments. For a
 * 4–5 s loop the top rendition is often never reached before the loop
 * restarts. Pinning `min` = `max` forces both Safari and hls.js to play
 * exactly the tier we chose, from frame 1 onward.
 *
 * Tier selection takes the minimum of:
 *  - **Container tier** — derived from container width × height × capped DPR
 *    (see {@link computeLoopVideoTarget}). Desktop-class displays round up to
 *    the covering rung, touch displays round down ({@link isFinePointerDisplay}).
 *    A fullscreen retina hero targets up to the ceiling; small inline loops
 *    target 720p or below.
 *  - **Network tier** — from {@link getNetworkAwareTierCeiling}. On Chrome
 *    this throttles back for cellular / save-data connections; on Safari this
 *    is always {@link MUX_PLAYBACK_MAX_TIER} (no API), so the container size
 *    is the sole signal.
 *
 * Result: a desktop visitor on wifi sees up to the asset's top rendition, a
 * phone on LTE sees 1080p–1440p, a phone on 3G sees 720p — all without ramp-up.
 */
type MuxLoopTierArgs = {
	videoWidthPx?: number;
	videoHeightPx?: number;
	containerWidthPx?: number;
	containerHeightPx?: number;
	devicePixelRatio?: number;
	/** Extra ceiling min-ed into the pick — the loop's stall rescue. */
	tierCeiling?: MuxResolutionTier;
};

/** The single pinned tier {@link muxLoopHlsSrc} resolves for these args. */
export function resolveMuxLoopTier(args: MuxLoopTierArgs): MuxResolutionTier {
	const cw = args.containerWidthPx ?? 0;
	const ch = args.containerHeightPx ?? 0;
	const vw = args.videoWidthPx ?? 16;
	const vh = args.videoHeightPx ?? 9;

	let containerTier: MuxResolutionTier = MUX_PLAYBACK_MAX_TIER;
	if (cw > 0 && ch > 0) {
		containerTier = computeLoopVideoTarget({
			containerWidthPx: cw,
			containerHeightPx: ch,
			devicePixelRatio: args.devicePixelRatio,
			videoWidthPx: vw,
			videoHeightPx: vh,
			roundTierUp: isFinePointerDisplay(),
		}).maxResolutionTier;
	}

	const tier = minResolutionTier(containerTier, getNetworkAwareTierCeiling());
	return args.tierCeiling ? minResolutionTier(tier, args.tierCeiling) : tier;
}

/**
 * `stream.mux.com` HLS URL (native `<video>` or hls.js) pinned to {@link resolveMuxLoopTier}.
 *
 * **`rendition_order=desc`**: Mux lists highest renditions first. Many native players pick the
 * first variant for the first segment — without this, playback often starts at a mid/low rung
 * even on fast connections.
 *
 * **`min_resolution` = `max_resolution`**: the single-tier manifest described above.
 *
 * @see https://docs.mux.com/guides/control-playback-resolution
 */
export function muxLoopHlsSrc(
	playbackId: string,
	args: MuxLoopTierArgs,
): string {
	const resolutionTier = resolveMuxLoopTier(args);
	const u = new URL(`https://stream.mux.com/${playbackId}.m3u8`);
	u.searchParams.set("rendition_order", "desc");
	/* Mux's documented parameter name is `min_resolution` (not
	 * `min_resolution_tier`) — unknown params are silently dropped, so the
	 * previous `min_resolution_tier=...` was a no-op and the manifest
	 * contained every rendition from the asset's lowest tier upward.
	 * Safari then naturally started ABR from the bottom rung. */
	u.searchParams.set("min_resolution", resolutionTier);
	u.searchParams.set("max_resolution", resolutionTier);
	return u.toString();
}

/**
 * Tiers the full player can pin — the intersection of Mux Player's
 * `minResolution` (480p–2160p) and `maxResolution` (720p–2160p) domains.
 */
type MuxPlayerResolutionTier = "720p" | "1080p" | "1440p" | "2160p";

export type MuxPlayerResolution = {
	minResolution?: MuxPlayerResolutionTier;
	maxResolution: MuxPlayerResolutionTier;
};

/** Floor a ladder tier into the player-pinnable domain (720p is also the visual-cliff floor). */
function playerTierFloor(tier: MuxResolutionTier): MuxPlayerResolutionTier {
	return TIER_RANK[tier] <= TIER_RANK["720p"]
		? "720p"
		: (tier as MuxPlayerResolutionTier);
}

/**
 * Resolution bounds for the full player (`MediaVideo`) — quality-first.
 *
 * The tier is keyed to the **display**, not the inline slot: the fullscreen
 * button is one click away, and an ABR ramp is visible exactly when the
 * viewer leans in. `min` = `max` pins the manifest to one rendition (same
 * mechanism as {@link muxLoopHlsSrc}), so playback starts at the best tier
 * for this display from the first segment; without the pin, hls.js / Safari
 * start conservatively and a 2K display sits on 720p for several segments.
 *
 * The pin is dropped in one case: {@link getNetworkAwareTierCeiling} reports
 * a degraded connection (save-data, cellular `effectiveType`). Then the
 * ceiling caps `max` and `min` stays unset so ABR can step down instead of
 * stalling. Browsers without the API assume a good connection; `MediaVideo`'s
 * stall rescue drops the pin if that guess is wrong.
 *
 * Client-only — returns `null` during SSR; callers keep the unpinned
 * {@link MUX_PLAYBACK_MAX_TIER} default until mounted.
 */
export function resolveMuxPlayerResolution(args: {
	videoWidthPx?: number;
	videoHeightPx?: number;
}): MuxPlayerResolution | null {
	if (typeof window === "undefined") return null;

	const dpr = Math.min(window.devicePixelRatio || 1, LOOP_VIDEO_DPR_CAP);
	const rawW = (window.screen?.width || window.innerWidth || 0) * dpr;
	const rawH = (window.screen?.height || window.innerHeight || 0) * dpr;
	const vw =
		args.videoWidthPx && args.videoWidthPx > 0 ? args.videoWidthPx : 16;
	const vh =
		args.videoHeightPx && args.videoHeightPx > 0 ? args.videoHeightPx : 9;

	/* Touch devices rotate for fullscreen playback, so orient their screen box
	 * to the video. Desktop screens stay as they are: a portrait video on a
	 * landscape monitor is contained by the monitor's height. Then take the
	 * `object-fit: contain` rendered height — what the ladder must cover. */
	const finePointer = isFinePointerDisplay();
	const landscapeVideo = vw >= vh;
	const longSide = Math.max(rawW, rawH);
	const shortSide = Math.min(rawW, rawH);
	const sw = finePointer ? rawW : landscapeVideo ? longSide : shortSide;
	const sh = finePointer ? rawH : landscapeVideo ? shortSide : longSide;
	const renderedH = sw > 0 && sh > 0 ? Math.min(sh, (sw * vh) / vw) : 0;

	/* Same rounding split as the loops: desktop-class displays get the covering
	 * tier, touch keeps the floor. */
	const displayTier =
		renderedH > 0
			? minResolutionTier(
					finePointer
						? muxCoveringResolutionTierFromHeight(renderedH)
						: muxResolutionTierFromHeight(renderedH),
					MUX_PLAYBACK_MAX_TIER,
				)
			: MUX_PLAYBACK_MAX_TIER;

	const networkTier = getNetworkAwareTierCeiling();
	if (networkTier !== MUX_PLAYBACK_MAX_TIER) {
		/* Degraded-connection signal: cap the ladder, leave `min` unset. */
		return {
			maxResolution: playerTierFloor(
				minResolutionTier(networkTier, displayTier),
			),
		};
	}

	const pinned = playerTierFloor(displayTier);
	return { minResolution: pinned, maxResolution: pinned };
}

/** Codec family parsed from an HLS `#EXT-X-STREAM-INF` CODECS attribute. */
export type MuxLevelCodecFamily = "av1" | "hevc" | "avc";

const MODERN_CODEC_ORDER: MuxLevelCodecFamily[] = ["av1", "hevc", "avc"];

/** Minimal hls.js level shape for rendition picking (no hls.js import). */
type MuxHlsLevelLike = {
	width?: number;
	height?: number;
	codecs?: string;
};

/**
 * Map a manifest CODECS string to AV1 / HEVC / H.264. Returns `null` when unknown.
 */
export function detectMuxLevelCodecFamily(
	codecs: string | undefined,
): MuxLevelCodecFamily | null {
	if (!codecs) return null;
	const c = codecs.toLowerCase();
	if (c.includes("av01")) return "av1";
	if (c.includes("hvc1") || c.includes("hev1")) return "hevc";
	if (c.includes("avc1")) return "avc";
	return null;
}

/** Client-only: MSE can decode baseline AV1 in fMP4. */
function isAv1MseSupported(): boolean {
	if (typeof window === "undefined") return false;
	const MS = window.MediaSource;
	if (!MS) return false;
	return MS.isTypeSupported('video/mp4; codecs="av01.0.01M.08"');
}

/** Client-only: MSE can decode HEVC in fMP4 (Chrome 107+ on many platforms). */
function isHevcMseSupported(): boolean {
	if (typeof window === "undefined") return false;
	const MS = window.MediaSource;
	if (!MS) return false;
	return MS.isTypeSupported('video/mp4; codecs="hvc1.1.6.L93.B0"');
}

function isMuxCodecFamilySupported(family: MuxLevelCodecFamily): boolean {
	if (family === "av1") return isAv1MseSupported();
	if (family === "hevc") return isHevcMseSupported();
	return true;
}

/**
 * MediaCapabilities-based codec probe: prefers AV1 only when the device can
 * decode it **smoothly and power-efficiently** (= hardware-accelerated).
 * Apple Silicon M1/M2 has no AV1 HW decoder — software decode for a 1440p
 * loop produces an audible CPU lag when playback starts. HEVC HW decode
 * exists on every M-series chip, so HEVC is the right fallback there.
 *
 * Resolution order:
 *   AV1 (HW)  →  HEVC (HW)  →  H.264 (always HW on supported clients)
 *
 * Result cached at the module level via a memoised Promise so every
 * `useMuxHlsSource` call shares one probe.
 */
let cachedPreferredCodec: Promise<MuxLevelCodecFamily> | null = null;

const PROBE_VIDEO_BASE = {
	width: 1920,
	height: 1080,
	bitrate: 5_000_000,
	framerate: 30,
} as const;

async function probeMediaCapability(contentType: string): Promise<{
	supported: boolean;
	smooth: boolean;
	powerEfficient: boolean;
} | null> {
	if (
		typeof navigator === "undefined" ||
		!navigator.mediaCapabilities?.decodingInfo
	) {
		return null;
	}
	try {
		const info = await navigator.mediaCapabilities.decodingInfo({
			type: "media-source",
			video: { contentType, ...PROBE_VIDEO_BASE },
		});
		return {
			supported: info.supported,
			smooth: info.smooth,
			powerEfficient: info.powerEfficient,
		};
	} catch {
		return null;
	}
}

export function getPreferredVideoCodec(): Promise<MuxLevelCodecFamily> {
	if (cachedPreferredCodec) return cachedPreferredCodec;
	cachedPreferredCodec = (async () => {
		const av1 = await probeMediaCapability('video/mp4; codecs="av01.0.13M.08"');
		if (av1?.supported && av1.smooth && av1.powerEfficient) {
			return "av1";
		}
		const hevc = await probeMediaCapability(
			'video/mp4; codecs="hvc1.1.6.L93.B0"',
		);
		if (hevc?.supported && hevc.smooth && hevc.powerEfficient) {
			return "hevc";
		}
		return "avc";
	})();
	return cachedPreferredCodec;
}

function pickSmallestSufficientLevelIndex(
	candidates: { i: number; h: number; w: number }[],
	targetW: number,
	targetH: number,
): number | undefined {
	if (!candidates.length) return undefined;
	const ascending = [...candidates].sort((a, b) => a.h - b.h || a.w - b.w);
	if (targetW > 0 && targetH > 0) {
		return (
			ascending.find((l) => l.h >= targetH && l.w >= targetW) ??
			ascending[ascending.length - 1]
		)?.i;
	}
	return ascending[ascending.length - 1]?.i;
}

/**
 * Pick the hls.js level index: smallest rendition that saturates the player (DPR-aware).
 * Tries AV1 → HEVC → H.264 before falling back to any level.
 */
export function pickMuxHlsLevelIndex(
	levels: MuxHlsLevelLike[],
	opts: {
		targetW: number;
		targetH: number;
		/** Codec families to skip (e.g. after a MEDIA_ERROR on AV1). */
		excludedFamilies: ReadonlySet<MuxLevelCodecFamily>;
		/**
		 * Promote a specific family to the front of the codec-order so it wins
		 * over the static AV1→HEVC→AVC default. Used by the runtime
		 * MediaCapabilities probe to skip software-decoded AV1 on hardware that
		 * doesn't accelerate it.
		 */
		preferredCodec: MuxLevelCodecFamily;
	},
): number | undefined {
	if (!levels.length) return undefined;

	const indexed = levels.map((lvl, i) => ({
		i,
		h: lvl.height ?? 0,
		w: lvl.width ?? 0,
		family: detectMuxLevelCodecFamily(lvl.codecs),
	}));

	const excluded = opts.excludedFamilies;
	const codecOrder = [
		opts.preferredCodec,
		...MODERN_CODEC_ORDER.filter((c) => c !== opts.preferredCodec),
	];

	for (const family of codecOrder) {
		if (excluded.has(family) || !isMuxCodecFamilySupported(family)) continue;
		const candidates = indexed.filter((l) => l.family === family);
		if (!candidates.length) continue;
		const pick = pickSmallestSufficientLevelIndex(
			candidates,
			opts.targetW,
			opts.targetH,
		);
		if (typeof pick === "number") return pick;
	}

	return pickSmallestSufficientLevelIndex(indexed, opts.targetW, opts.targetH);
}

/**
 * Mux `asset.thumbTime` — the time (in seconds) selected in Studio for the poster frame.
 */
export function muxThumbnailTimeSec(media: unknown): number {
	if (!media || typeof media !== "object") return 0;
	const asset = (media as Record<string, unknown>).asset;
	if (!asset || typeof asset !== "object") return 0;
	const t = (asset as Record<string, unknown>).thumbTime;
	return typeof t === "number" ? t : 0;
}
