"use client";

/**
 * Mux playback via **`@mux/mux-player-react/lazy`**: poster until play (unless autoplay).
 * Wrapper class `mux-player` scopes look-and-feel (`components/mux-player.css`).
 *
 * Use {@link MediaVideoLoop} for silent, looping background clips (`autoplay` + no controls).
 */

import MuxPlayer from "@mux/mux-player-react/lazy";
import clsx from "clsx";
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
	MUX_PLAYBACK_MAX_TIER,
	type MuxPlayerResolution,
	muxThumbnailRequestWidthPx,
	muxThumbnailTimeSec,
	resolveMuxPlayerResolution,
} from "@/src/utils/muxPlayback";
import { resolveMediaPosterUrl } from "@/src/utils/resolveMediaPoster";
import { useContainerPixelWidth } from "@/src/utils/useContainerPixelWidth";

export type MediaVideoProps = {
	media: unknown;
	caption?: string | null;
	posterPayload?: unknown;
	videoSettings?: {
		autoplay?: boolean | null;
		controls?: boolean | null;
	} | null;
	className?: string;
	/** Fill the parent (no fixed aspect ratio) — e.g. fullscreen background video. */
	fillParent?: boolean;
	/** Optional fixed aspect ratio override (e.g. `"3 / 2"`). */
	aspectRatioOverride?: string;
	/**
	 * Optional override for Mux `accentColor` (progress / scrubber). Default `#262626`.
	 */
	accentColor?: string;
	/**
	 * Above-the-fold hint: starts loading the player bundle + HLS manifest immediately
	 * (no `IntersectionObserver` wait, `preload="auto"`). Use for hero / LCP videos only.
	 */
	priority?: boolean;
};

/** Progress / scrubber accent — dark grey (Mux default is pink). */
const MUX_ACCENT = "#262626";
/** Icons on the control bar. */
const MUX_PRIMARY = "#e3e3e3";
/** Control bar surface — transparent so controls have no chip/backplate. */
const MUX_SECONDARY = "transparent";

/**
 * Stall rescue deadline: a `waiting` rebuffer that isn't resolved within this window means the
 * pinned min = max rendition outruns the connection. Safari and Firefox expose no Network
 * Information API, so the pin is chosen blind there. After the deadline `minResolution` is
 * dropped (the `maxResolution` cap stays) so ABR may step down instead of stalling.
 */
const STALL_RESCUE_MS = 3000;

/**
 * Poster hold after `play`: keep the poster fully visible this long before its fade-out starts,
 * so the first video frame has painted and the 200 ms fade (`mux-player.css`) lands on picture
 * instead of a black gap.
 */
const POSTER_HOLD_MS = 250;

/**
 * Grace period before a player that scrolled out of view is paused. Flicking past a player
 * doesn't stop a clip that is about to be back on screen; nothing keeps playing unseen.
 */
const OFFSCREEN_PAUSE_DELAY_MS = 150;

/**
 * The bits of `MuxPlayerElement` driven imperatively. Typed structurally rather than importing
 * the element class — the player loads lazily, and its type would pull the client-only module
 * into this boundary.
 */
type MuxPlayerHandle = HTMLElement & {
	play: () => Promise<void> | void;
	pause: () => void;
	paused: boolean;
	ended: boolean;
};

export function MediaVideo({
	media,
	caption,
	posterPayload,
	videoSettings,
	className,
	fillParent = false,
	aspectRatioOverride,
	accentColor: accentColorProp,
	priority = false,
}: MediaVideoProps) {
	const playbackId = extractMuxPlaybackId(media);
	const [containerRef, slotWidthPx] = useContainerPixelWidth<HTMLDivElement>();
	const dims = getMuxDisplayDimensions(media);
	const autoplay = !!videoSettings?.autoplay;
	const chromeless = videoSettings?.controls === false;

	/* Client-only and latched once per asset: screen and network are read after mount (SSR
	 * renders the unpinned ceiling), and NOT re-resolved on resize — a min/max change swaps
	 * the stream src and restarts playback. */
	const [resolution, setResolution] = useState<MuxPlayerResolution | null>(
		null,
	);
	useEffect(() => {
		setResolution(
			resolveMuxPlayerResolution({
				videoWidthPx: dims.isFallback ? undefined : dims.width,
				videoHeightPx: dims.isFallback ? undefined : dims.height,
			}),
		);
	}, [dims.isFallback, dims.width, dims.height]);

	/* Stall rescue (see {@link STALL_RESCUE_MS}): `waiting` arms a deadline, `playing` disarms
	 * it. Latched — one hard stall frees ABR for this player for good (the src swap restarts
	 * buffering; flip-flopping the pin would swap it repeatedly). */
	const [stallDegraded, setStallDegraded] = useState(false);
	const stallTimerRef = useRef<number | undefined>(undefined);
	const disarmStallTimer = useCallback(() => {
		if (stallTimerRef.current !== undefined) {
			window.clearTimeout(stallTimerRef.current);
			stallTimerRef.current = undefined;
		}
	}, []);
	const onPlayerWaiting = useCallback(() => {
		if (stallTimerRef.current !== undefined) return;
		stallTimerRef.current = window.setTimeout(() => {
			stallTimerRef.current = undefined;
			setStallDegraded(true);
		}, STALL_RESCUE_MS);
	}, []);
	useEffect(() => disarmStallTimer, [disarmStallTimer]);

	/* Poster dismissal: on the first `play`, hold the poster for {@link POSTER_HOLD_MS}, then
	 * set `[data-poster-hidden]` so `mux-player.css` fades the poster layer out. The timer arms
	 * once and `posterHidden` never resets, so the stall rescue's src swap can't re-show the
	 * poster mid-clip. */
	const [posterHidden, setPosterHidden] = useState(false);
	const posterHoldTimerRef = useRef<number | undefined>(undefined);
	useEffect(
		() => () => {
			if (posterHoldTimerRef.current !== undefined) {
				window.clearTimeout(posterHoldTimerRef.current);
			}
		},
		[],
	);

	/* Who paused the player. A pause we trigger (off-screen) is resumable; a pause the visitor
	 * made with the controls is theirs and sticks. Pauses while the tab is hidden come from
	 * the browser, not the visitor. */
	const userPausedRef = useRef(false);
	const expectingPauseRef = useRef(false);

	const onPlayerPlay = useCallback(() => {
		userPausedRef.current = false;
		if (posterHoldTimerRef.current !== undefined) return;
		posterHoldTimerRef.current = window.setTimeout(
			() => setPosterHidden(true),
			POSTER_HOLD_MS,
		);
	}, []);
	const onPlayerPause = useCallback(() => {
		if (expectingPauseRef.current) {
			expectingPauseRef.current = false;
			return;
		}
		if (document.visibilityState === "visible") userPausedRef.current = true;
	}, []);

	/* Imperative handle for viewport pause / resume. The lazy wrapper mounts a placeholder
	 * first, so `playerReady` tells the effects below when the element exists. */
	const playerRef = useRef<MuxPlayerHandle | null>(null);
	const [playerReady, setPlayerReady] = useState(false);
	const bindPlayer = useCallback((player: HTMLElement | null) => {
		playerRef.current = player as MuxPlayerHandle | null;
		setPlayerReady(player !== null);
	}, []);

	/** Resume an autoplay clip that stopped without the visitor asking for it. */
	const resumeAutoplay = useCallback(() => {
		const player = playerRef.current;
		if (!autoplay || !player?.paused || player.ended) return;
		if (userPausedRef.current) return;
		void Promise.resolve(player.play()).catch(() => {});
	}, [autoplay]);

	/* Pause once the player leaves the viewport — a clip nobody is looking at is bandwidth
	 * and noise. Autoplay clips resume when they scroll back; a clip the visitor started stays
	 * paused, they didn't ask for it to follow them. Debounced so a fast scroll-through
	 * doesn't stop a player that is about to be back on screen. */
	useEffect(() => {
		if (!playerReady) return;
		const root = containerRef.current;
		if (!root) return;
		let pauseTimer: number | undefined;
		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry) return;
				if (entry.isIntersecting) {
					if (pauseTimer !== undefined) {
						window.clearTimeout(pauseTimer);
						pauseTimer = undefined;
					}
					resumeAutoplay();
					return;
				}
				pauseTimer = window.setTimeout(() => {
					pauseTimer = undefined;
					const player = playerRef.current;
					if (!player || player.paused) return;
					expectingPauseRef.current = true;
					player.pause();
				}, OFFSCREEN_PAUSE_DELAY_MS);
			},
			{ threshold: 0 },
		);
		io.observe(root);
		return () => {
			io.disconnect();
			if (pauseTimer !== undefined) window.clearTimeout(pauseTimer);
		};
	}, [playerReady, containerRef, resumeAutoplay]);

	/* Returning to a long-backgrounded tab: browsers suspend background media and may evict
	 * the MSE buffer, leaving an autoplay clip paused with nothing watching it. Nudge it back
	 * into motion when the tab is visible again. */
	useEffect(() => {
		if (!playerReady || !autoplay) return;
		const onVisible = () => {
			if (document.visibilityState === "visible") resumeAutoplay();
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => document.removeEventListener("visibilitychange", onVisible);
	}, [playerReady, autoplay, resumeAutoplay]);

	/* Poster URL latched once per asset: deriving it from the measured slot width swapped the
	 * URL one commit after mount, and a priority player could fetch both. The pre-measurement
	 * URL is what the SSR placeholder already shows, so it wins for good. The ref write during
	 * render is idempotent per playbackId and identical on server and client. */
	const posterLatchRef = useRef<{ id: string; url: string | null } | null>(
		null,
	);

	if (!playbackId) return null;

	const aspectCss = dims.isFallback
		? "16 / 9"
		: `${dims.width} / ${dims.height}`;
	const resolvedAspectRatio = aspectRatioOverride ?? aspectCss;

	const thumbnailTime = muxThumbnailTimeSec(media);
	if (posterLatchRef.current?.id !== playbackId) {
		posterLatchRef.current = {
			id: playbackId,
			url: resolveMediaPosterUrl({
				posterPayload,
				muxMedia: media,
				thumbWidthPx: muxThumbnailRequestWidthPx({
					containerWidthPx: slotWidthPx,
					assetMaxWidthPx: dims.isFallback ? undefined : dims.width,
				}),
				muxTimeSec: thumbnailTime,
			}),
		};
	}
	const posterUrl = posterLatchRef.current.url;

	const muxSurfaceStyle = {
		...(fillParent
			? { height: "100%", width: "100%", minHeight: "100%" as const }
			: { height: "100%", width: "100%" }),
		...(chromeless
			? ({
					["--media-control-display" as string]: "none",
				} as CSSProperties)
			: {}),
	} satisfies CSSProperties;

	const videoTitle =
		typeof caption === "string" && caption.length > 0 ? caption : "Video";

	return (
		<div
			ref={containerRef}
			className={clsx(
				"mux-player relative w-full min-w-0 overflow-hidden bg-black",
				fillParent &&
					"h-full min-h-[100dvh] w-full [&_mux-player]:!block [&_mux-player]:!h-full [&_mux-player]:!min-h-full [&_mux-player]:!w-full",
				className,
			)}
			style={fillParent ? undefined : { aspectRatio: resolvedAspectRatio }}
			data-poster-hidden={posterHidden ? "" : undefined}
		>
			<MuxPlayer
				ref={bindPlayer}
				loading={priority ? "page" : "viewport"}
				preload={priority ? "auto" : "metadata"}
				streamType="on-demand"
				playbackId={playbackId}
				poster={posterUrl ?? undefined}
				thumbnailTime={thumbnailTime}
				/* `"muted"` rather than `true`: playback-core forces the element muted before
				 * play() and retries muted if an unmuted attempt is denied, instead of failing
				 * silently on autoplay policy. */
				autoPlay={autoplay ? "muted" : false}
				/* Constant per instance, so React never re-applies it and fights the mute
				 * button. Autoplay clips start muted (the only way autoplay may begin); clips
				 * the visitor starts play with sound. */
				muted={autoplay}
				playsInline
				renditionOrder="desc"
				/* Quality-first (see `resolveMuxPlayerResolution`): min = max pins the best
				 * tier for this display from the first segment; on a degraded connection, or
				 * after the stall rescue fired, min stays unset so ABR can step down instead
				 * of rebuffering. Pre-mount / SSR: unpinned hard ceiling. */
				minResolution={stallDegraded ? undefined : resolution?.minResolution}
				maxResolution={resolution?.maxResolution ?? MUX_PLAYBACK_MAX_TIER}
				onPlay={onPlayerPlay}
				onPause={onPlayerPause}
				onWaiting={onPlayerWaiting}
				onPlaying={disarmStallTimer}
				/* Privacy + bytes: skip Mux Data analytics pings and the
				 * associated cookies. We lose the Mux Data dashboard, but no
				 * cookie banner is needed for video playback. Re-enable per
				 * project if observability is wanted. */
				disableTracking
				disableCookies
				metadataVideoTitle={videoTitle}
				accentColor={accentColorProp ?? MUX_ACCENT}
				primaryColor={MUX_PRIMARY}
				secondaryColor={MUX_SECONDARY}
				className="absolute inset-0 block h-full w-full max-w-none"
				style={muxSurfaceStyle}
			/>
		</div>
	);
}
