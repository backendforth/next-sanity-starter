import {
	type InferComponents,
	type InferStrictComponents,
	stegaBrand,
} from "next-sanity";
import type { ReactNode } from "react";

import type { LinkMark, RichTextMediaValue } from "@/sanity/types";
import {
	type LinkLocaleOptions,
	resolveLinkMark,
} from "@/sanity/utils/linkResolver";
import { ModuleCarousel } from "@/src/components/modules/ModuleCarousel";
import { ModuleMedia } from "@/src/components/modules/ModuleMedia";

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
 * Components for a `richTextMedia` body: blocks, lists, link marks and the inline modules.
 * Document-level i18n: embedded modules hold the document's language already; `locale` only
 * points internal links at that language's URLs. The `types` map is checked strictly: `tsc` fails when an inline module type
 * the query returns has no handler here, or a handler names a type it never returns. Handlers
 * get `value` typed clean-or-branded; `stegaBrand` (identity) types it as fetched, branded.
 */
export function portableTextMediaComponents({
	locale,
	siteLocale,
}: LinkLocaleOptions) {
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
				<LinkMarkRenderer value={value} localeOptions={{ locale, siteLocale }}>
					{children}
				</LinkMarkRenderer>
			),
		},
		types: {
			"module.media": ({ value }) => (
				<div className="rich-text-embed rich-text-embed-media min-w-0">
					<ModuleMedia module={stegaBrand(value)} variant="embed" />
				</div>
			),
			"module.carousel": ({ value }) => (
				<div className="rich-text-embed w-full min-w-0">
					<ModuleCarousel module={stegaBrand(value)} variant="embed" />
				</div>
			),
		} satisfies InferStrictComponents<RichTextMediaValue>["types"],
	} satisfies InferComponents<RichTextMediaValue>;
}
