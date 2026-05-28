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

type CarouselOptions = {
	loop: boolean;
	showThumbnails: boolean;
	showNavDots: boolean;
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
	const [thumbsRef, thumbsApi] = useEmblaCarousel({
		containScroll: "keepSnaps",
		dragFree: true,
	});

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [snapCount, setSnapCount] = useState(0);
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
		setSnapCount(emblaApi.scrollSnapList().length);
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

	if (slides.length === 0) return null;

	return (
		<div className="flex flex-col gap-3">
			<div className="relative">
				<div ref={emblaRef} className="overflow-hidden rounded-md bg-black">
					<div className="flex">
						{slides.map((slide, index) => (
							<div
								key={slide.key}
								className="relative aspect-video min-w-0 shrink-0 grow-0 basis-full"
							>
								<CarouselSlide
									slide={slide}
									isActive={index === selectedIndex}
								/>
							</div>
						))}
					</div>
				</div>

				{snapCount > 1 ? (
					<>
						<button
							type="button"
							onClick={scrollPrev}
							disabled={!options.loop && !canScrollPrev}
							aria-label="Previous slide"
							className="absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-30"
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
							className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-30"
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
					</>
				) : null}
			</div>

			{options.showNavDots && snapCount > 1 ? (
				<div className="flex items-center justify-center gap-2">
					{slides.slice(0, snapCount).map((slide, index) => {
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
					<div className="flex gap-2">
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
