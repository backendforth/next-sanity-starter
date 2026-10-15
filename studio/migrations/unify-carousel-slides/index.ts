import { at, defineMigration, set, unset } from "sanity/migrate";

/**
 * `module.carousel` keeps its slides in one field, `slides: module.media[]`. The old schema had
 * two lists and an `imagesOnly` switch (unset counts as on): plain images in `slides`, or
 * `module.media` items in `slidesMedia`. The list the web rendered becomes `slides` — plain
 * images wrapped as image media (without a caption), or `slidesMedia` moved over — and
 * `imagesOnly` and `slidesMedia` are unset, the hidden list's content with them. Wherever the
 * module sits (modules and rich text). A carousel already in the new shape is skipped, so a
 * re-run is safe. The export it reads includes drafts, so they are migrated too.
 *
 * How and when to run it: `scripts/README.md` → "Content migrations".
 */

type Item = { _key?: string; _type?: string } & Record<string, unknown>;

function toMediaSlide(slide: Item): Item {
  if (slide._type === "module.media") return slide;
  const { _key, ...image } = slide;
  return {
    _key,
    _type: "module.media",
    type: "image",
    imageContent: { _type: "media.image", image },
  };
}

export default defineMigration({
  title: "Carousel: one slides list of media",
  migrate: {
    object(node) {
      if (node._type !== "module.carousel") return;
      const slides = Array.isArray(node.slides) ? (node.slides as Item[]) : [];
      const isLegacy =
        node.imagesOnly !== undefined ||
        node.slidesMedia !== undefined ||
        slides.some((slide) => slide._type !== "module.media");
      if (!isLegacy) return;

      const rendered =
        node.imagesOnly === false
          ? Array.isArray(node.slidesMedia)
            ? (node.slidesMedia as Item[])
            : []
          : slides.map(toMediaSlide);
      return [
        at("slides", rendered.length > 0 ? set(rendered) : unset()),
        ...(node.imagesOnly === undefined ? [] : [at("imagesOnly", unset())]),
        ...(node.slidesMedia === undefined ? [] : [at("slidesMedia", unset())]),
      ];
    },
  },
});
