import type { ReactNode } from "react";

import type { ModuleOf, RichTextEmbedOf } from "@/sanity/types";
import { isStegaVariant } from "@/sanity/utils/stegaVariant";
import {
	LazyMediaVideo,
	LazyMediaVideoLoop,
} from "@/src/components/media/LazyVideo";
import { MediaImage } from "@/src/components/media/MediaImage";

import { moduleCaptionClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A `modules[]` entry or the same module inline in rich text — both carry `resolvedMedia`. */
type MediaModule = ModuleOf<"module.media"> | RichTextEmbedOf<"module.media">;

type Props = {
	module: MediaModule;
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

function renderModuleMediaFigure(module: MediaModule, priority: boolean) {
	const rm = module.resolvedMedia;
	if (!rm.media) return null;

	if (isStegaVariant(rm, "kind", "loop")) {
		return (
			<MediaFigure caption={rm.caption}>
				<LazyMediaVideoLoop
					media={rm.media}
					caption={rm.caption}
					posterPayload={rm.poster}
					allowUnmute={rm.allowUnmute === true}
					posterPriority={priority}
				/>
			</MediaFigure>
		);
	}

	if (isStegaVariant(rm, "kind", "video")) {
		return (
			<MediaFigure caption={rm.caption}>
				{isLoopIntent(rm.videoSettings) ? (
					<LazyMediaVideoLoop
						media={rm.media}
						caption={rm.caption}
						posterPayload={rm.poster}
						posterPriority={priority}
					/>
				) : (
					<LazyMediaVideo
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

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `module.media` — image, video (MuxPlayer), or silent loop, from the `resolvedMedia` GROQ
 * builds per kind. Its `select` always yields an object (image is the default branch), so there
 * is no fallback to the raw `*Content` fields.
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
