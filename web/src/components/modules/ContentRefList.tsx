import Link from "next/link";

import { MediaImage } from "@/src/components/media/MediaImage";

import type { ContentRefListItem } from "./ModuleContentRefs";

function ContentRefCardTitle({ label }: { label: string }) {
	return <h3 className="heading-4 mt-xs mb-xs">{label}</h3>;
}

/**
 * The content-ref card grid. No directive: `ModuleContentRefs` renders it on the server when the
 * list has no controls, `ModuleContentRefsClient` under its filter and sort controls.
 */
export function ContentRefList({
	items,
	priority,
}: {
	items: ContentRefListItem[];
	/** First module on the page — eager-load the first card image (LCP candidate). */
	priority: boolean;
}) {
	return (
		<ul className="grid gap-xs sm:grid-cols-2 lg:grid-cols-3">
			{items.map((item, index) => {
				const { key, href, label, previewImage } = item;
				const cardMedia = previewImage ? (
					<div className="relative aspect-4/3 overflow-hidden bg-color-surface-muted">
						<MediaImage
							imagePayload={previewImage}
							alt={label}
							fillParent
							quality={75}
							/* One column, `sm:` two, `lg:` three (`breakpoints.css`). */
							sizes="(max-width: 899px) 100vw, (max-width: 1439px) 50vw, 33vw"
							priority={priority && index === 0}
						/>
					</div>
				) : null;
				if (!href) {
					return (
						<li key={key} className="text-color-text-muted">
							{cardMedia}
							<ContentRefCardTitle label={label} />
						</li>
					);
				}
				return (
					<li key={key}>
						<Link
							href={href}
							className="block text-color-text transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent"
						>
							{cardMedia}
							<ContentRefCardTitle label={label} />
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
