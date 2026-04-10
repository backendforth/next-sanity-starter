import clsx from "clsx";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { ReactNode } from "react";

/**
 * **Source of truth for body copy in the app** matches Studio schema **`richTextMedia`**
 * (`internationalizedArrayRichTextMedia` on `module.text`, etc.): blocks + embedded `module.*`.
 *
 * Plain **`richText`** (blocks only, no media modules) exists in Studio as an optional fallback;
 * it is not wired in the UI yet — add a separate renderer if you introduce fields that use it.
 */

type ResolvedRef = {
  _type?: string;
  slug?: string | null;
};

/** Portable Text `link` mark — aligned with GROQ `linkQuery` / `studio/schemas/objects/link.ts`. */
export type RichTextMediaLinkMark = {
  _type?: string;
  type?: "internal" | "external" | "function" | string;
  title?: string | null;
  url?: string | null;
  blank?: boolean | null;
  resolvedReference?: ResolvedRef | null;
  func?: { key?: string; params?: string | null } | null;
};

function internalHref(ref: ResolvedRef | null | undefined): string | undefined {
  if (!ref?._type) return undefined;
  if (ref._type === "home") return "/";
  if (ref._type === "page" && ref.slug) return `/${ref.slug}`;
  return undefined;
}

function LinkMark({
  children,
  value,
}: {
  children?: ReactNode;
  value?: RichTextMediaLinkMark;
}) {
  if (!value || value._type !== "link") {
    return <>{children}</>;
  }

  if (value.type === "external" && value.url) {
    const blank = value.blank !== false;
    return (
      <a
        href={value.url}
        target={blank ? "_blank" : undefined}
        rel={blank ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  if (value.type === "internal") {
    const href = internalHref(value.resolvedReference ?? undefined);
    if (href) {
      return (
        <a
          href={href}
        >
          {children}
        </a>
      );
    }
  }

  if (value.type === "function") {
    return (
      <span className="cursor-default underline decoration-dotted decoration-link-decoration">
        {children}
      </span>
    );
  }

  return <>{children}</>;
}

const components: Partial<PortableTextComponents> = {
  block: {
    normal: ({ children }) => (
      <p className="mb-4 last:mb-0">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 first:mt-0">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-2 mt-4 first:mt-0">
        {children}
      </h4>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 space-y-1 pl-6">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 space-y-1 pl-6">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="px-1.5 py-0.5">
        {children}
      </code>
    ),
    link: ({ children, value }) => (
      <LinkMark value={value as RichTextMediaLinkMark}>{children}</LinkMark>
    ),
  },
  types: {
    "module.media": () => null,
    "module.carousel": () => null,
  },
};

type RichTextMediaProps = {
  value: PortableTextBlock[];
  className?: string;
};

/**
 * Renders Portable Text from **`richTextMedia`** (blocks, links, embedded modules).
 * Feed values from `pickLocalizedPortableTextBlocks` for i18n `body` fields.
 */
export function RichTextMedia({ value, className }: RichTextMediaProps) {
  if (!value.length) return null;
  return (
    <div className={clsx("rich-text-media", className)}>
      <PortableText value={value} components={components} onMissingComponent={false} />
    </div>
  );
}
