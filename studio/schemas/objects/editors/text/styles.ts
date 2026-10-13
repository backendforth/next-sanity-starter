import {
  PtPreviewBigText,
  PtPreviewH1,
  PtPreviewH2,
  PtPreviewH3,
  PtPreviewH4,
  PtPreviewNormal,
} from "../../../../components/portableText/StyleBlockPreviews";

/**
 * Portable Text block styles — values must stay stable (GROQ / frontend mapping).
 *
 * **Studio font previews (optional):** each entry can expose `component` so the desk editor
 * approximates site typography. CSS lives in `studio/styles/portableTextStylePreviews.css`
 * (imported from `sanity.config.ts`). Mapping to web Tailwind `@utility` names is documented
 * in that CSS file.
 *
 * **To turn off in-editor previews** (plain blocks again): delete the `component` property
 * from every object below, or replace this export with the plain array in the comment at
 * the bottom of this file.
 */
export const portableTextStyles = [
  {
    title: "Text (md)",
    value: "normal",
    component: PtPreviewNormal,
  },
  {
    title: "Big text (lg)",
    value: "bigText",
    component: PtPreviewBigText,
  },
  {
    title: "Heading 1 (3lg)",
    value: "h1",
    component: PtPreviewH1,
  },
  {
    title: "Heading 2 (2lg)",
    value: "h2",
    component: PtPreviewH2,
  },
  {
    title: "Heading 3 (lg)",
    value: "h3",
    component: PtPreviewH3,
  },
  {
    title: "Heading 4 (md)",
    value: "h4",
    component: PtPreviewH4,
  },
];

/* Plain variant (no Studio preview components) — swap for `portableTextStyles` if needed:
export const portableTextStyles = [
  { title: "Text (md)", value: "normal" },
  { title: "Big text (lg)", value: "bigText" },
  { title: "Heading 1 (3lg)", value: "h1" },
  { title: "Heading 2 (2lg)", value: "h2" },
  { title: "Heading 3 (lg)", value: "h3" },
  { title: "Heading 4 (md)", value: "h4" },
];
*/
