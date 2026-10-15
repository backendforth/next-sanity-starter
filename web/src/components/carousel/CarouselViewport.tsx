"use client";

import clsx from "clsx";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { resolveMediaImageSource } from "@/src/utils/mediaImageSource";
import { usePrefersReducedMotion } from "@/src/utils/usePrefersReducedMotion";

import { CarouselSlide, type NormalizedSlide } from "./CarouselSlide";
import { multiSlideLayout } from "./carouselMultiSlideLayout";

type CarouselOptions = {
	loop: boolean;
	showThumbnails: boolean;
	showNavDots: boolean;
	multipleSlides: boolean;
	autoplay: boolean;
	autoplayDelayMs: number;
};

/** Control `aria-label`s, resolved to the page locale on the server; one per slide for the lists. */
type CarouselLabels = {
	prev: string;
	next: string;
	goToSlide: string[];
	showSlide: string[];
};

type Props = {
	slides: NormalizedSlide[];
	options: CarouselOptions;
	labels: CarouselLabels;
	/** The page's LCP candidate: the first slide loads eagerly. */
	priority?: boolean;
};

const THUMBNAIL_WIDTH_PX = 160;

/** Image slides use the image; video and loop slides their poster, else the Mux thumbnail. */
function thumbnailUrlForSlide(slide: NormalizedSlide): string | null {
	const isImage = slide.kind === "image";
	return (
		resolveMediaImageSource({
			image: isImage ? slide.media : slide.poster,
			muxMedia: isImage ? undefined : slide.media,
			maxWidthPx: THUMBNAIL_WIDTH_PX,
		})?.src ?? null
	);
}

/**
 * Embla viewport with optional autoplay, prev/next, dots, and a synced thumbnail strip.
 * Reduced-motion users get a still carousel: autoplay is suspended but interaction works.
 */
export function CarouselViewport({
	slides,
	options,
	labels,
	priority = false,
}: Props) {
	const reducedMotion = usePrefersReducedMotion();

	/* Lazy init: `useRef(Autoplay(...))` evaluates its argument on every render, which built
	 * and discarded a fresh plugin each time. */
	const autoplayPlugin = useRef<ReturnType<typeof Autoplay> | null | undefined>(
		undefined,
	);
	if (autoplayPlugin.current === undefined) {
		autoplayPlugin.current = options.autoplay
			? Autoplay({
					delay: Math.max(1000, options.autoplayDelayMs),
					stopOnInteraction: true,
					stopOnMouseEnter: true,
				})
			: null;
	}

	const isMulti = options.multipleSlides;
	const [emblaRef, emblaApi] = useEmblaCarousel(
		/* A slide counts as in view once about half of it shows (browsers differ at the edge). */
		{ loop: options.loop, align: "start", inViewThreshold: 0.5 },
		autoplayPlugin.current ? [autoplayPlugin.current] : [],
	);
	const [thumbsRef, thumbsApi] = useEmblaCarousel({
		containScroll: "keepSnaps",
		dragFree: true,
	});

	/* `align: "start"`, one slide per step: snap k starts at slide k, and the trailing slides that
	 * fit beside the last snap share it. Until Embla measures, every slide is its own snap. */
	const [selectedSnap, setSelectedSnap] = useState(0);
	const [snapCount, setSnapCount] = useState(slides.length);
	const [slidesInView, setSlidesInView] = useState<number[]>([0]);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		const snap = emblaApi.selectedScrollSnap();
		setSelectedSnap(snap);
		setSnapCount(emblaApi.scrollSnapList().length);
		setCanScrollPrev(emblaApi.canScrollPrev());
		setCanScrollNext(emblaApi.canScrollNext());
		thumbsApi?.scrollTo(snap);
	}, [emblaApi, thumbsApi]);

	const onSlidesInView = useCallback(() => {
		if (emblaApi) setSlidesInView(emblaApi.slidesInView());
	}, [emblaApi]);

	useEffect(() => {
		if (!emblaApi) return;
		onSelect();
		onSlidesInView();
		emblaApi.on("select", onSelect);
		emblaApi.on("reInit", onSelect);
		emblaApi.on("slidesInView", onSlidesInView);
		return () => {
			emblaApi.off("select", onSelect);
			emblaApi.off("reInit", onSelect);
			emblaApi.off("slidesInView", onSlidesInView);
		};
	}, [emblaApi, onSelect, onSlidesInView]);

	/* One slide at a time: the selected one is active. Several side by side: every slide in view
	 * is — a loop plays, a video shows its player — so none waits for a selection it can't get.
	 * The selected snap's first slide counts too: a slide wider than half the viewport is never
	 * half in view, but scrolled to it sits at the start. */
	const isSlideActive = (index: number) =>
		index === selectedSnap || (isMulti && slidesInView.includes(index));

	/* Suspend autoplay under reduced motion and resume it only when the preference flips back,
	 * not on every effect run — a `stopOnInteraction` stop must survive unrelated re-renders. */
	const wasReducedMotionRef = useRef(false);
	useEffect(() => {
		if (!options.autoplay) return;
		const plugin = autoplayPlugin.current;
		if (!plugin) return;
		if (reducedMotion) {
			plugin.stop();
		} else if (wasReducedMotionRef.current) {
			plugin.play();
		}
		wasReducedMotionRef.current = reducedMotion;
	}, [reducedMotion, options.autoplay]);

	const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
	const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
	const scrollToSlide = useCallback(
		(index: number) => emblaApi?.scrollTo(Math.min(index, snapCount - 1)),
		[emblaApi, snapCount],
	);

	const thumbnails = useMemo(
		() =>
			options.showThumbnails
				? slides.map((slide) => thumbnailUrlForSlide(slide))
				: null,
		[slides, options.showThumbnails],
	);

	const multiLayout = useMemo(
		() => (isMulti ? multiSlideLayout(slides) : null),
		[isMulti, slides],
	);

	/* Nothing to navigate when every slide fits at once. */
	const showNavigation = snapCount > 1;

	return (
		<div className="flex flex-col gap-sm">
			<div
				ref={emblaRef}
				className={clsx(
					"overflow-hidden",
					isMulti ? "@container" : "rounded-md bg-black",
				)}
			>
				<div
					className={clsx(
						"flex",
						isMulti && "gap-md [--slides:2] md:[--slides:3]",
					)}
				>
					{slides.map((slide, index) => {
						const layout = multiLayout?.[index];
						return (
							<div
								key={slide.key}
								className={clsx(
									"relative min-w-0 shrink-0 grow-0",
									!layout && "aspect-video basis-full",
								)}
								style={layout?.style}
							>
								<CarouselSlide
									slide={slide}
									isActive={isSlideActive(index)}
									priority={priority && index === 0}
									imageSizes={layout?.sizes}
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
						aria-label={labels.prev}
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
						aria-label={labels.next}
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
						const isActive = isSlideActive(index);
						return (
							<button
								key={`dot-${slide.key}`}
								type="button"
								onClick={() => scrollToSlide(index)}
								aria-label={labels.goToSlide[index]}
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

			{thumbnails && showNavigation ? (
				<div ref={thumbsRef} className="overflow-hidden">
					<div className="flex gap-xs">
						{slides.map((slide, index) => {
							const url = thumbnails[index];
							const isActive = isSlideActive(index);
							return (
								<button
									key={`thumb-${slide.key}`}
									type="button"
									onClick={() => scrollToSlide(index)}
									aria-label={labels.showSlide[index]}
									aria-current={isActive ? "true" : undefined}
									className={clsx(
										"relative aspect-video w-24 shrink-0 overflow-hidden rounded-4xl border transition",
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
