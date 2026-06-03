import type { ReactNode } from "react";

/**
 * Block renderers for Portable Text styles (see `schemas/objects/editors/text/styles.ts`).
 * Class names match `studio/styles/portableTextStylePreviews.css` (`pt-preview--*`).
 * Dropdown labels: `schemas/objects/editors/text/styles.ts`.
 *
 * To disable previews: remove `component` from the style entries in `styles.ts` — the
 * schema values (`normal`, `h1`, `h2`, …) stay the same for stored content / frontend mapping.
 */

type BlockProps = {
  children?: ReactNode;
};

function wrap(className: string, props: BlockProps) {
  return <div className={className}>{props.children}</div>;
}

export function PtPreviewNormal(props: BlockProps) {
  return wrap("pt-preview pt-preview--normal", props);
}

export function PtPreviewBigText(props: BlockProps) {
  return wrap("pt-preview pt-preview--big-text", props);
}

export function PtPreviewH1(props: BlockProps) {
  return wrap("pt-preview pt-preview--h1", props);
}

export function PtPreviewH2(props: BlockProps) {
  return wrap("pt-preview pt-preview--h2", props);
}

export function PtPreviewH3(props: BlockProps) {
  return wrap("pt-preview pt-preview--h3", props);
}

export function PtPreviewH4(props: BlockProps) {
  return wrap("pt-preview pt-preview--h4", props);
}
