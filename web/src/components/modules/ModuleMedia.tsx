"use client";

import type { ReactNode } from "react";

import type { ModuleMediaData } from "@/sanity/types/modules";
import { MediaImage, MediaVideo, MediaVideoLoop } from "@/src/components/media";

import { moduleCaptionClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	module: ModuleMediaData;
	/** `module` = document `modules[]` slot; `embed` = inline rich text (no section chrome). */
	variant?: "module" | "embed";
	/**
	 * First module on the page — the LCP candidate. Eager-loads the image /
	 * video poster (`fetchpriority=high`, no lazy fade-in). Set by
	 * `ModulesRenderer` for index 0; leave unset everywhere else.
	 */
	priority?: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** `autoplay && !controls` → silent loop (no MuxPlayer chrome). Mirrors Studio intent. */
function isLoopIntent(
	settings:
		| { autoplay?: boolean | null; controls?: boolean | null }
		| null
		| undefined,
): boolean {
	return Boolean(settings?.autoplay) && settings?.controls === false;
}

function MediaFigure({
	caption,
	children,
}: {
	caption?: string | null;
	children: ReactNode;
}) {
	return (
		<figure className="w-full min-w-0">
			{children}
			{caption ? (
				<figcaption className={moduleCaptionClassName}>{caption}</figcaption>
			) : null}
		</figure>
	);
}

function renderModuleMediaFigure(module: ModuleMediaData, priority: boolean) {
	const rm = module.resolvedMedia;

	if (rm?.kind === "image" && rm.media) {
		return (
			<MediaFigure caption={rm.caption}>
				<MediaImage
					imagePayload={rm.media}
					caption={rm.caption}
					priority={priority}
				/>
			</MediaFigure>
		);
	}

	if (rm?.kind === "loop" && rm.media) {
		return (
			<MediaFigure caption={rm.caption}>
				<MediaVideoLoop
					media={rm.media}
					caption={rm.caption}
					posterPayload={rm.poster}
					allowUnmute={rm.allowUnmute === true}
					posterPriority={priority}
				/>
			</MediaFigure>
		);
	}

	if (rm?.kind === "video" && rm.media) {
		return (
			<MediaFigure caption={rm.caption}>
				{isLoopIntent(rm.videoSettings) ? (
					<MediaVideoLoop
						media={rm.media}
						caption={rm.caption}
						posterPayload={rm.poster}
						posterPriority={priority}
					/>
				) : (
					<MediaVideo
						media={rm.media}
						caption={rm.caption}
						posterPayload={rm.poster}
						videoSettings={rm.videoSettings}
						priority={priority}
					/>
				)}
			</MediaFigure>
		);
	}

	const imagePayload = module.imageContent?.image ?? module.imageContent?.media;

	if (module.type === "image" && imagePayload) {
		return (
			<MediaFigure caption={module.imageContent?.caption}>
				<MediaImage
					imagePayload={imagePayload}
					caption={module.imageContent?.caption}
					priority={priority}
				/>
			</MediaFigure>
		);
	}

	if (module.type === "loop" && module.videoLoopContent) {
		const muxField =
			module.videoLoopContent.video ?? module.videoLoopContent.media;
		return (
			<MediaFigure caption={module.videoLoopContent.caption}>
				<MediaVideoLoop
					media={muxField}
					caption={module.videoLoopContent.caption}
					posterPayload={module.videoLoopContent.poster}
					allowUnmute={module.videoLoopContent.allowUnmute === true}
					posterPriority={priority}
				/>
			</MediaFigure>
		);
	}

	if (module.type === "video" && module.videoContent) {
		const muxField = module.videoContent.video ?? module.videoContent.media;
		return (
			<MediaFigure caption={module.videoContent.caption}>
				{isLoopIntent(module.videoContent.videoSettings) ? (
					<MediaVideoLoop
						media={muxField}
						caption={module.videoContent.caption}
						posterPayload={module.videoContent.poster}
						posterPriority={priority}
					/>
				) : (
					<MediaVideo
						media={muxField}
						caption={module.videoContent.caption}
						posterPayload={module.videoContent.poster}
						videoSettings={module.videoContent.videoSettings}
						priority={priority}
					/>
				)}
			</MediaFigure>
		);
	}

	return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `module.media` — image, video (MuxPlayer), or silent loop. GROQ resolves per-kind
 * payloads into `resolvedMedia`; raw `*Content` fields remain as fallbacks.
 */
export function ModuleMedia({
	module,
	variant = "module",
	priority = false,
}: Props) {
	const figure = renderModuleMediaFigure(module, priority);
	if (!figure) return null;

	if (variant === "embed") return figure;

	return <section className={moduleSectionClassName}>{figure}</section>;
}
