export const homeQuery = `*[_id == "home"][0]{
  _id,
  title,
  modules,
  seo {
    title,
    description,
    "imageUrl": image.asset->url
  }
}`;

export const pageBySlugQuery = `*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  modules,
  seo {
    title,
    description,
    "imageUrl": image.asset->url
  }
}`;

export const pageSlugsQuery = `*[_type == "page" && defined(slug.current)]{
  "slug": slug.current
}`;
