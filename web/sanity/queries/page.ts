import { modulesFieldGroq } from "./modulesProjection";

export const pageBySlugQuery = `*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  ${modulesFieldGroq},
  seo {
    title,
    description,
    "imageUrl": image.asset->url
  }
}`;

export const pageSlugsQuery = `*[_type == "page" && defined(slug.current)]{
  "slug": slug.current
}`;
