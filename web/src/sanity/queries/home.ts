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
