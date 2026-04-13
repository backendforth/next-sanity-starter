import { moduleCarouselQuery } from "./carousel";
import { moduleContentRefsQuery } from "./contentRefs";
import { moduleMediaQuery } from "./media";
import { moduleTextQuery } from "./text";

export const modulesQuery = `modules[]{
  _key,
  _type,
  ${moduleTextQuery},
  ${moduleMediaQuery},
  ${moduleCarouselQuery},
  ${moduleContentRefsQuery}
}`;

export { richTextMediaQuery } from "../text/richTextMedia";
export {
	moduleCarouselQuery,
	moduleContentRefsQuery,
	moduleMediaQuery,
	moduleTextQuery,
};
