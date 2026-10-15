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
	muxThumbnailRequestWidthPx,
	muxThumbnailTimeSec,
} from "@/src/utils/muxImage";
import {
	MUX_PLAYBACK_MAX_TIER,
	type MuxPlayerResolution,
	preconnectMux,
	resolveMuxPlayerResolution,
} from "@/src/utils/muxPlayback";
import { resolveMediaPosterUrl } from "@/src/utils/resolveMediaPoster";
import { usePrefersReducedMotion } from "@/src/utils/usePrefersReducedMotion";

type MediaVideoProps = {
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
	/**
	 * Above-the-fold hint: loads the player bundle immediately (no `IntersectionObserver` wait)
	 * and, for autoplay clips, the stream (`preload="auto"`). Use for hero / LCP videos only.
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
 * Stall rescue deadline: once playback has run, a `waiting` rebuffer that isn't resolved within
 * this window means the pinned min = max rendition outruns the connection. Safari and Firefox
 * expose no Network Information API, so the pin is chosen blind there. After the deadline
 * `minResolution` is dropped (the `maxResolution` cap stays) so ABR may step down instead of
 * stalling; the player resumes where it was.
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
 * Re-check interval for an off-screen player in fullscreen / PiP. Leaving either mode doesn't
 * re-fire the IntersectionObserver when the inline box is still off-screen, so the deferred
 * pause looks again until the player is back in the page.
 */
const DETACHED_RECHECK_MS = 1000;

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
	currentTime: number;
	/** `mux-video` element; its `nativeEl` is the `<video>`. */
	media?: { nativeEl?: HTMLVideoElement } | null;
};

/**
 * This player is in fullscreen or picture-in-picture: the inline box can leave the viewport
 * while it plays. Another player in either mode doesn't count. Both APIs retarget an element
 * inside the player's shadow tree (its `<video>`, its media controller) to the player itself.
 */
function isPlayerDetachedFromPage(player: MuxPlayerHandle): boolean {
	const isOwn = (el: Element | null) =>
		el !== null && (el === player || player.contains(el));
	if (
		isOwn(document.fullscreenElement) ||
		isOwn(document.pictureInPictureElement)
	) {
		return true;
	}
	/* iOS plays fullscreen through the native `<video>`, outside the Fullscreen API. */
	const video = player.media?.nativeEl as
		| (HTMLVideoElement & { webkitDisplayingFullscreen?: boolean })
		| undefined;
	return video?.webkitDisplayingFullscreen === true;
}

/**
 * Keyed by playback ID, so swapping the asset (e.g. in Presentation) starts a fresh player
 * instead of inheriting the previous one's stall and poster state.
 */
export function MediaVideo(props: MediaVideoProps) {
	const playbackId = extractMuxPlaybackId(props.media);
	if (!playbackId) return null;
	preconnectMux();
	return <MuxVideoPlayer key={playbackId} playbackId={playbackId} {...props} />;
}

function MuxVideoPlayer({
	playbackId,
	media,
	caption,
	posterPayload,
	videoSettings,
	className,
	fillParent = false,
	priority = false,
}: MediaVideoProps & { playbackId: string }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const dims = getMuxDisplayDimensions(media);
	/* Reduced motion: autoplay clips wait for the visitor, like loops and carousels. */
	const reducedMotion = usePrefersReducedMotion();
	const autoplayClip = !!videoSettings?.autoplay;
	const autoplay = autoplayClip && !reducedMotion;
	const chromeless = videoSettings?.controls === false;

	/* Client-only and latched: screen and network are read after mount (SSR renders the
	 * unpinned ceiling), and NOT re-resolved on resize — a min/max change swaps the stream src
	 * and reloads the player. */
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

	/* Imperative handle for viewport pause / resume and the stall rescue. The lazy wrapper
	 * mounts a placeholder first, so `playerReady` tells the effects when the element exists. */
	const playerRef = useRef<MuxPlayerHandle | null>(null);
	const [playerReady, setPlayerReady] = useState(false);
	const bindPlayer = useCallback((player: HTMLElement | null) => {
		playerRef.current = player as MuxPlayerHandle | null;
		setPlayerReady(player !== null);
	}, []);

	/* Who paused the player. A pause we trigger (off-screen, stall swap) is resumable; a pause
	 * the visitor made with the controls is theirs and sticks. Pauses while the tab is hidden
	 * come from the browser, not the visitor. */
	const userPausedRef = useRef(false);
	const expectingPauseRef = useRef(false);
	/* Last IntersectionObserver verdict (`null` until the first callback); nothing autoplays
	 * while it is `false`. */
	const inViewRef = useRef<boolean | null>(null);

	/* Stall rescue (see {@link STALL_RESCUE_MS}). Armed by `waiting` only after playback has
	 * run once — startup and a fresh seek legitimately wait for the first segment — and
	 * disarmed by `playing` or `pause`. Latched: one hard stall frees ABR for this player for
	 * good. The swap reloads the stream, so position and play state are carried over through
	 * `startTime` and a `play()` on the next `canplay`. */
	const [stallDegraded, setStallDegraded] = useState(false);
	const [resumeAtSec, setResumeAtSec] = useState<number | undefined>(undefined);
	const hasPlayedRef = useRef(false);
	const resumeAfterSwapRef = useRef(false);
	const stallTimerRef = useRef<number | undefined>(undefined);
	const disarmStallTimer = useCallback(() => {
		if (stallTimerRef.current !== undefined) {
			window.clearTimeout(stallTimerRef.current);
			stallTimerRef.current = undefined;
		}
	}, []);
	useEffect(() => disarmStallTimer, [disarmStallTimer]);
	const onPlayerWaiting = useCallback(() => {
		if (!hasPlayedRef.current || stallDegraded) return;
		if (stallTimerRef.current !== undefined) return;
		stallTimerRef.current = window.setTimeout(() => {
			stallTimerRef.current = undefined;
			const player = playerRef.current;
			if (player) {
				setResumeAtSec(player.currentTime);
				resumeAfterSwapRef.current = !player.paused;
			}
			setStallDegraded(true);
		}, STALL_RESCUE_MS);
	}, [stallDegraded]);
	const onPlayerCanPlay = useCallback(() => {
		if (!resumeAfterSwapRef.current) return;
		resumeAfterSwapRef.current = false;
		const player = playerRef.current;
		if (player?.paused) void Promise.resolve(player.play()).catch(() => {});
	}, []);

	/* Poster dismissal: on the first `play`, hold the poster for {@link POSTER_HOLD_MS}, then
	 * set `[data-poster-hidden]` so `mux-player.css` fades the poster layer out. */
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

	const onPlayerPlay = useCallback(() => {
		const player = playerRef.current;
		/* Autoplay can kick in for a player that is already off-screen (a priority player whose
		 * chunk lands after the visitor scrolled away). */
		if (
			player &&
			inViewRef.current === false &&
			!isPlayerDetachedFromPage(player)
		) {
			expectingPauseRef.current = true;
			player.pause();
			return;
		}
		userPausedRef.current = false;
		if (posterHoldTimerRef.current !== undefined) return;
		posterHoldTimerRef.current = window.setTimeout(
			() => setPosterHidden(true),
			POSTER_HOLD_MS,
		);
	}, []);
	const onPlayerPlaying = useCallback(() => {
		hasPlayedRef.current = true;
		disarmStallTimer();
	}, [disarmStallTimer]);
	const onPlayerPause = useCallback(() => {
		disarmStallTimer();
		if (expectingPauseRef.current) {
			expectingPauseRef.current = false;
			return;
		}
		if (resumeAfterSwapRef.current) return;
		if (document.visibilityState === "visible") userPausedRef.current = true;
	}, [disarmStallTimer]);

	/** Resume an on-screen autoplay clip that stopped without the visitor asking for it. */
	const resumeAutoplay = useCallback(() => {
		const player = playerRef.current;
		if (!autoplay || !player?.paused || player.ended) return;
		if (userPausedRef.current || inViewRef.current === false) return;
		void Promise.resolve(player.play()).catch(() => {});
	}, [autoplay]);

	/* Pause once the player leaves the viewport — a clip nobody is looking at is bandwidth
	 * and noise. Autoplay clips resume when they scroll back; a clip the visitor started stays
	 * paused, they didn't ask for it to follow them. Debounced so a fast scroll-through
	 * doesn't stop a player that is about to be back on screen; deferred while this player is
	 * in fullscreen / PiP, where the inline box can drift out of view while the video is what's
	 * on screen. */
	useEffect(() => {
		if (!playerReady) return;
		const root = containerRef.current;
		if (!root) return;
		let pauseTimer: number | undefined;
		const schedulePause = (delayMs: number) => {
			pauseTimer = window.setTimeout(() => {
				pauseTimer = undefined;
				const player = playerRef.current;
				if (!player || player.paused) return;
				if (isPlayerDetachedFromPage(player)) {
					schedulePause(DETACHED_RECHECK_MS);
					return;
				}
				expectingPauseRef.current = true;
				player.pause();
			}, delayMs);
		};
		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry) return;
				inViewRef.current = entry.isIntersecting;
				if (entry.isIntersecting) {
					if (pauseTimer !== undefined) {
						window.clearTimeout(pauseTimer);
						pauseTimer = undefined;
					}
					resumeAutoplay();
					return;
				}
				if (pauseTimer === undefined) schedulePause(OFFSCREEN_PAUSE_DELAY_MS);
			},
			{ threshold: 0 },
		);
		io.observe(root);
		return () => {
			io.disconnect();
			if (pauseTimer !== undefined) window.clearTimeout(pauseTimer);
		};
	}, [playerReady, resumeAutoplay]);

	/* Reduced motion switched on mid-play: dropping `autoPlay` doesn't stop the clip, so pause
	 * it here. Expected, so it doesn't count as the visitor's pause. */
	useEffect(() => {
		const player = playerRef.current;
		if (!playerReady || !reducedMotion || !autoplayClip) return;
		if (!player || player.paused) return;
		expectingPauseRef.current = true;
		player.pause();
	}, [playerReady, reducedMotion, autoplayClip]);

	/* Returning to a long-backgrounded tab: browsers suspend background media and may evict
	 * the MSE buffer, leaving an autoplay clip paused with nothing watching it. Nudge it back
	 * into motion when the tab is visible again — only if it is on screen. */
	useEffect(() => {
		if (!playerReady || !autoplay) return;
		const onVisible = () => {
			if (document.visibilityState === "visible") resumeAutoplay();
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => document.removeEventListener("visibilitychange", onVisible);
	}, [playerReady, autoplay, resumeAutoplay]);

	/* One URL for the server HTML, the lazy placeholder and the player, so the poster is in the
	 * first paint and downloads once. Not sized to the slot: measuring after mount changed the
	 * URL and fetched it twice; retina-wide (capped by the asset) covers full-width players. */
	const thumbnailTime = muxThumbnailTimeSec(media);
	const posterUrl = resolveMediaPosterUrl({
		posterPayload,
		muxMedia: media,
		thumbWidthPx: muxThumbnailRequestWidthPx({
			containerWidthPx: undefined,
			assetMaxWidthPx: dims.isFallback ? undefined : dims.width,
		}),
		muxTimeSec: thumbnailTime,
	});

	/* `getMuxDisplayDimensions` already falls back to 16×9. */
	const aspectCss = `${dims.width} / ${dims.height}`;

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
					"h-full w-full [&_mux-player]:!block [&_mux-player]:!h-full [&_mux-player]:!min-h-full [&_mux-player]:!w-full",
				className,
			)}
			style={fillParent ? undefined : { aspectRatio: aspectCss }}
			data-poster-hidden={posterHidden ? "" : undefined}
		>
			<MuxPlayer
				ref={bindPlayer}
				loading={priority ? "page" : "viewport"}
				/* `auto` restores hls.js' full forward buffer; only worth it for a clip that plays
				 * by itself. */
				preload={priority && autoplay ? "auto" : "metadata"}
				streamType="on-demand"
				playbackId={playbackId}
				poster={posterUrl ?? undefined}
				/* The lazy wrapper paints only `placeholder` until the player chunk loads. */
				placeholder={posterUrl ?? undefined}
				thumbnailTime={thumbnailTime}
				startTime={resumeAtSec}
				/* `"muted"` rather than `true`: playback-core forces the element muted before
				 * play() and retries muted if an unmuted attempt is denied, instead of failing
				 * silently on autoplay policy. */
				autoPlay={autoplay ? "muted" : false}
				/* Constant per instance, so React never re-applies it and fights the mute
				 * button (the reduced-motion preference is live). Autoplay clips start muted,
				 * the only way autoplay may begin, also when reduced motion holds them back;
				 * other clips play with sound. */
				muted={autoplayClip}
				playsInline
				renditionOrder="desc"
				/* Quality-first (see `resolveMuxPlayerResolution`): min = max pins the best
				 * tier for this display from the first segment; on a degraded connection, or
				 * after the stall rescue fired, min stays unset so ABR can step down instead
				 * of rebuffering. Pre-mount / SSR: unpinned hard ceiling. */
				minResolution={stallDegraded ? undefined : resolution?.minResolution}
				maxResolution={resolution?.maxResolution ?? MUX_PLAYBACK_MAX_TIER}
				onPlay={onPlayerPlay}
				onPlaying={onPlayerPlaying}
				onPause={onPlayerPause}
				onWaiting={onPlayerWaiting}
				onCanPlay={onPlayerCanPlay}
				/* Privacy + bytes: skip Mux Data analytics pings and the
				 * associated cookies. We lose the Mux Data dashboard, but no
				 * cookie banner is needed for video playback. Re-enable per
				 * project if observability is wanted. */
				disableTracking
				disableCookies
				metadataVideoTitle={videoTitle}
				accentColor={MUX_ACCENT}
				primaryColor={MUX_PRIMARY}
				secondaryColor={MUX_SECONDARY}
				className="absolute inset-0 block h-full w-full max-w-none"
				style={muxSurfaceStyle}
			/>
		</div>
	);
}
