import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import clsx from "clsx";
import type { ReactNode } from "react";

import type {
	ModuleCarouselData,
	ModuleMediaData,
} from "@/sanity/types/modules";
import { type LinkMark, resolveLinkMark } from "@/sanity/utils/linkResolver";
import { ModuleCarousel } from "@/src/components/carousel";
import { ModuleMedia } from "@/src/components/modules/ModuleMedia";

/**
 * **Source of truth for body copy in the app** matches Studio schema **`richTextMedia`**
 * (`internationalizedArrayRichTextMedia` on `module.text`, etc.): blocks + embedded `module.*`.
 *
 * Plain **`richText`** (blocks only, no media modules) exists in Studio as an optional fallback;
 * it is not wired in the UI yet — add a separate renderer if you introduce fields that use it.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** @deprecated Import `LinkMark` from `@/sanity/utils/linkResolver` instead. */
export type RichTextMediaLinkMark = LinkMark;

type RichTextMediaProps = {
	value: PortableTextBlock[];
	className?: string;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function LinkMarkRenderer({
	children,
	value,
}: {
	children?: ReactNode;
	value?: LinkMark;
}) {
	const resolved = resolveLinkMark(value);
	if (!resolved) {
		return <>{children}</>;
	}
	if (resolved.kind === "function") {
		return (
			<span className="cursor-default underline decoration-dotted decoration-color-link-decoration">
				{children}
			</span>
		);
	}
	return (
		<a href={resolved.href} target={resolved.target} rel={resolved.rel}>
			{children}
		</a>
	);
}

// ─── Portable Text configuration ─────────────────────────────────────────────

function portableTextComponents(): Partial<PortableTextComponents> {
	return {
		block: {
			normal: ({ children }) => <p>{children}</p>,
			h2: ({ children }) => <h2>{children}</h2>,
			h3: ({ children }) => <h3>{children}</h3>,
			h4: ({ children }) => <h4>{children}</h4>,
		},
		list: {
			bullet: ({ children }) => <ul>{children}</ul>,
			number: ({ children }) => <ol>{children}</ol>,
		},
		listItem: {
			bullet: ({ children }) => <li>{children}</li>,
			number: ({ children }) => <li>{children}</li>,
		},
		marks: {
			strong: ({ children }) => <strong>{children}</strong>,
			em: ({ children }) => <em className="italic">{children}</em>,
			code: ({ children }) => <code className="px-1.5 py-0.5">{children}</code>,
			link: ({ children, value }) => (
				<LinkMarkRenderer value={value as LinkMark}>
					{children}
				</LinkMarkRenderer>
			),
		},
		types: {
			"module.media": ({ value }) => (
				<div className="rich-text-embed w-full min-w-0">
					<ModuleMedia module={value as ModuleMediaData} />
				</div>
			),
			"module.carousel": ({ value }) => (
				<div className="rich-text-embed w-full min-w-0">
					<ModuleCarousel module={value as ModuleCarouselData} />
				</div>
			),
		},
	};
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Renders Portable Text from **`richTextMedia`** (blocks, links, embedded `module.media`).
 * Feed values from `pickLocalizedPortableTextBlocks` for i18n `body` fields.
 */
export function RichTextMedia({ value, className }: RichTextMediaProps) {
	if (!value.length) return null;
	const components = portableTextComponents();
	return (
		<div
			className={clsx(
				"rich-text rich-text-media w-full min-w-0 [&_.rich-text-embed]:max-w-none",
				className,
			)}
		>
			<PortableText
				value={value}
				components={components}
				onMissingComponent={false}
			/>
		</div>
	);
}
