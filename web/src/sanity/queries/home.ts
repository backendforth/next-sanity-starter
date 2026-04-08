import { modulesFieldGroq } from "./modulesProjection";

export const homeQuery = `*[_id == "home"][0]{
  _id,
  title,
  ${modulesFieldGroq},
  seo {
    title,
    description,
    "imageUrl": image.asset->url
  }
}`;
