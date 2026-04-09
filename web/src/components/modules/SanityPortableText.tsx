import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { ReactNode } from "react";

type ResolvedRef = {
  _type?: string;
  slug?: string | null;
};

export type SanityLinkMark = {
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
  value?: SanityLinkMark;
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
      <span className="cursor-default underline decoration-dotted decoration-linkDecoration">
        {children}
      </span>
    );
  }

  return <>{children}</>;
}

const components: Partial<PortableTextComponents> = {
  block: {
    normal: ({ children }) => (
      <p className="mb-4 text-base leading-relaxed text-textMuted last:mb-0">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 text-2xl font-semibold tracking-tight text-headingColor first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 text-xl font-semibold tracking-tight text-headingColor first:mt-0">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-2 mt-4 text-lg font-semibold tracking-tight text-headingColor first:mt-0">
        {children}
      </h4>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 list-disc space-y-1 pl-6 text-textMuted">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-1 pl-6 text-textMuted">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-textColor">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded bg-codeBg px-1.5 py-0.5 font-mono text-[0.9em] text-codeText">
        {children}
      </code>
    ),
    link: ({ children, value }) => <LinkMark value={value as SanityLinkMark}>{children}</LinkMark>,
  },
  types: {
    "module.media": () => null,
    "module.carousel": () => null,
    "module.contentRefs": () => null,
    "module.text": () => null,
  },
};

type SanityPortableTextProps = {
  value: PortableTextBlock[];
  className?: string;
};

export function SanityPortableText({ value, className }: SanityPortableTextProps) {
  if (!value.length) return null;
  return (
    <div className={className}>
      <PortableText value={value} components={components} onMissingComponent={false} />
    </div>
  );
}
