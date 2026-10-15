import type { PortableTextComponents } from "@portabletext/react";
import type { ReactNode } from "react";

import type {
	ModuleCarouselData,
	ModuleMediaData,
} from "@/sanity/types/modules";
import {
	type LinkLocaleOptions,
	type LinkMark,
	resolveLinkMark,
} from "@/sanity/utils/linkResolver";
import { ModuleCarousel, ModuleMedia } from "@/src/components/modules";

function LinkMarkRenderer({
	children,
	value,
	localeOptions,
}: {
	children?: ReactNode;
	value?: LinkMark;
	localeOptions: LinkLocaleOptions;
}) {
	const resolved = resolveLinkMark(value, localeOptions);
	if (!resolved) {
		return <>{children}</>;
	}
	if (resolved.kind === "function") {
		return <span className="cursor-default text-color-link">{children}</span>;
	}
	return (
		<a href={resolved.href} target={resolved.target} rel={resolved.rel}>
			{children}
		</a>
	);
}

/**
 * Blocks, lists, and marks shared by `richText` and `richTextMedia`. Internal links point at
 * `locale`'s version of the target; without it they stay locale-agnostic.
 */
export function portableTextBlockComponents(
	localeOptions: LinkLocaleOptions = {},
): Partial<PortableTextComponents> {
	return {
		block: {
			normal: ({ children }) => <p className="text">{children}</p>,
			bigText: ({ children }) => <p className="big-text">{children}</p>,
			h1: ({ children }) => <h2 className="heading-1">{children}</h2>,
			h2: ({ children }) => <h2 className="heading-2">{children}</h2>,
			h3: ({ children }) => <h3 className="heading-3">{children}</h3>,
			h4: ({ children }) => <h4 className="heading-4">{children}</h4>,
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
			strong: ({ children }) => (
				<strong className="font-mono">{children}</strong>
			),
			em: ({ children }) => <em className="font-mono italic">{children}</em>,
			code: ({ children }) => <code>{children}</code>,
			link: ({ children, value }) => (
				<LinkMarkRenderer
					value={value as LinkMark}
					localeOptions={localeOptions}
				>
					{children}
				</LinkMarkRenderer>
			),
		},
	};
}

/**
 * `richTextMedia` — blocks plus embedded `module.*` types. Document-level i18n:
 * embedded modules hold the document's language already; `locale` only localizes links.
 */
export function portableTextMediaComponents({
	locale,
	siteLocale,
}: LinkLocaleOptions): Partial<PortableTextComponents> {
	return {
		...portableTextBlockComponents({ locale, siteLocale }),
		types: {
			"module.media": ({ value }) => (
				<div className="rich-text-embed rich-text-embed-media min-w-0">
					<ModuleMedia module={value as ModuleMediaData} variant="embed" />
				</div>
			),
			"module.carousel": ({ value }) => (
				<div className="rich-text-embed w-full min-w-0">
					<ModuleCarousel
						module={value as ModuleCarouselData}
						variant="embed"
					/>
				</div>
			),
		},
	};
}
