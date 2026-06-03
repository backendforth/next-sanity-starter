"use client";

import clsx from "clsx";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
	resolveSanityImageFieldForUrl,
	urlForFetchedImage,
} from "@/sanity/utils/sanityImageBuilder";
import {
	extractMuxPlaybackId,
	muxThumbnailTimeSec,
	muxThumbnailUrl,
} from "@/src/utils/muxPlayback";

import { CarouselSlide, type NormalizedSlide } from "./CarouselSlide";
import {
	slideWidthAtRowHeightPx,
	useMultiSlideRowHeight,
} from "./carouselMultiSlideLayout";

type CarouselOptions = {
	loop: boolean;
	showThumbnails: boolean;
	showNavDots: boolean;
	multipleSlides: boolean;
	autoplay: boolean;
	autoplayDelayMs: number;
};

type Props = {
	slides: NormalizedSlide[];
	options: CarouselOptions;
};

const THUMBNAIL_WIDTH_PX = 160;

function thumbnailUrlForSlide(slide: NormalizedSlide): string | null {
	const imageSource = slide.kind === "image" ? slide.media : slide.poster;
	const img = resolveSanityImageFieldForUrl(imageSource);
	if (img) {
		return urlForFetchedImage(img, THUMBNAIL_WIDTH_PX);
	}
	if (slide.kind === "video") {
		const playbackId = extractMuxPlaybackId(slide.media);
		if (playbackId) {
			return muxThumbnailUrl(playbackId, muxThumbnailTimeSec(slide.media), {
				width: THUMBNAIL_WIDTH_PX,
			});
		}
	}
	return null;
}

/**
 * Embla viewport with optional autoplay, prev/next, dots, and a synced thumbnail strip.
 * Reduced-motion users get a still carousel: autoplay is suspended but interaction works.
 */
export function CarouselViewport({ slides, options }: Props) {
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => setReducedMotion(mq.matches);
		sync();
		mq.addEventListener("change", sync);
		return () => mq.removeEventListener("change", sync);
	}, []);

	const autoplayPlugin = useRef(
		options.autoplay
			? Autoplay({
					delay: Math.max(1000, options.autoplayDelayMs),
					stopOnInteraction: true,
					stopOnMouseEnter: true,
				})
			: null,
	);

	const [emblaRef, emblaApi] = useEmblaCarousel(
		{ loop: options.loop, align: "start" },
		autoplayPlugin.current ? [autoplayPlugin.current] : [],
	);
	const viewportRef = useRef<HTMLDivElement | null>(null);

	const setViewportRef = useCallback(
		(node: HTMLDivElement | null) => {
			viewportRef.current = node;
			emblaRef(node);
		},
		[emblaRef],
	);
	const [thumbsRef, thumbsApi] = useEmblaCarousel({
		containScroll: "keepSnaps",
		dragFree: true,
	});

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		const idx = emblaApi.selectedScrollSnap();
		setSelectedIndex(idx);
		setCanScrollPrev(emblaApi.canScrollPrev());
		setCanScrollNext(emblaApi.canScrollNext());
		thumbsApi?.scrollTo(idx);
	}, [emblaApi, thumbsApi]);

	useEffect(() => {
		if (!emblaApi) return;
		onSelect();
		emblaApi.on("select", onSelect);
		emblaApi.on("reInit", onSelect);
		return () => {
			emblaApi.off("select", onSelect);
			emblaApi.off("reInit", onSelect);
		};
	}, [emblaApi, onSelect]);

	useEffect(() => {
		if (!options.autoplay) return;
		const plugin = autoplayPlugin.current;
		if (!plugin) return;
		if (reducedMotion) {
			plugin.stop();
		}
	}, [reducedMotion, options.autoplay]);

	const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
	const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
	const scrollTo = useCallback(
		(index: number) => emblaApi?.scrollTo(index),
		[emblaApi],
	);

	const thumbnails = useMemo(
		() =>
			options.showThumbnails
				? slides.map((slide) => thumbnailUrlForSlide(slide))
				: null,
		[slides, options.showThumbnails],
	);

	const isMulti = options.multipleSlides;
	const multiSlideRowHeight = useMultiSlideRowHeight(
		isMulti,
		slides,
		viewportRef,
	);

	useEffect(() => {
		if (!emblaApi || !isMulti || !multiSlideRowHeight) return;
		emblaApi.reInit();
	}, [emblaApi, isMulti, multiSlideRowHeight]);

	if (slides.length === 0) return null;

	const imageSizes = isMulti ? "(max-width: 768px) 50vw, 33vw" : "100vw";
	const showNavigation = slides.length > 1;

	return (
		<div className="flex flex-col gap-sm">
			<div
				ref={setViewportRef}
				className={clsx(
					"overflow-hidden",
					isMulti ? undefined : "rounded-md bg-black",
				)}
			>
				<div className={clsx("flex", isMulti && "gap-md")}>
					{slides.map((slide, index) => {
						const slideWidthPx =
							isMulti && multiSlideRowHeight
								? slideWidthAtRowHeightPx(slide, multiSlideRowHeight)
								: undefined;

						return (
							<div
								key={slide.key}
								className={clsx(
									"relative shrink-0 grow-0",
									isMulti ? "min-h-0" : "min-w-0 aspect-video basis-full",
								)}
								style={
									isMulti && multiSlideRowHeight && slideWidthPx
										? {
												height: multiSlideRowHeight,
												width: slideWidthPx,
												flexBasis: slideWidthPx,
											}
										: undefined
								}
							>
								<CarouselSlide
									slide={slide}
									isActive={index === selectedIndex}
									imageSizes={imageSizes}
									respectAspectRatio={isMulti}
									rowHeightPx={multiSlideRowHeight}
								/>
							</div>
						);
					})}
				</div>
			</div>

			{showNavigation ? (
				<div className="flex items-center justify-center gap-sm">
					<button
						type="button"
						onClick={scrollPrev}
						disabled={!options.loop && !canScrollPrev}
						aria-label="Previous slide"
						className="grid h-9 w-9 place-items-center rounded-sm bg-color-surface-muted text-color-text transition hover:bg-color-brand hover:text-color-bg disabled:cursor-not-allowed disabled:opacity-30"
					>
						<svg
							viewBox="0 0 24 24"
							width={18}
							height={18}
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<polyline points="15 18 9 12 15 6" />
						</svg>
					</button>
					<button
						type="button"
						onClick={scrollNext}
						disabled={!options.loop && !canScrollNext}
						aria-label="Next slide"
						className="grid h-9 w-9 place-items-center rounded-sm bg-color-surface-muted text-color-text transition hover:bg-color-brand hover:text-color-bg disabled:cursor-not-allowed disabled:opacity-30"
					>
						<svg
							viewBox="0 0 24 24"
							width={18}
							height={18}
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</button>
				</div>
			) : null}

			{options.showNavDots && showNavigation ? (
				<div className="flex items-center justify-center gap-xs">
					{slides.map((slide, index) => {
						const isActive = index === selectedIndex;
						return (
							<button
								key={`dot-${slide.key}`}
								type="button"
								onClick={() => scrollTo(index)}
								aria-label={`Go to slide ${index + 1}`}
								aria-current={isActive ? "true" : undefined}
								className={clsx(
									"h-2 w-2 rounded-full transition",
									isActive
										? "bg-color-text"
										: "bg-color-border-subtle hover:bg-color-text-muted",
								)}
							/>
						);
					})}
				</div>
			) : null}

			{options.showThumbnails && thumbnails ? (
				<div ref={thumbsRef} className="overflow-hidden">
					<div className="flex gap-xs">
						{slides.map((slide, index) => {
							const url = thumbnails[index];
							const isActive = index === selectedIndex;
							return (
								<button
									key={`thumb-${slide.key}`}
									type="button"
									onClick={() => scrollTo(index)}
									aria-label={`Show slide ${index + 1}`}
									aria-current={isActive ? "true" : undefined}
									className={clsx(
										"relative aspect-video w-24 shrink-0 overflow-hidden rounded border transition",
										isActive
											? "border-color-text"
											: "border-color-border-subtle opacity-60 hover:opacity-100",
									)}
								>
									{url ? (
										// biome-ignore lint/performance/noImgElement: deterministic Sanity / Mux URLs match other media components.
										<img
											src={url}
											alt=""
											className="absolute inset-0 h-full w-full object-cover"
											loading="lazy"
											decoding="async"
										/>
									) : null}
								</button>
							);
						})}
					</div>
				</div>
			) : null}
		</div>
	);
}
