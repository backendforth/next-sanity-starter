import {
	type CreateDataAttributeProps,
	createDataAttribute,
} from "next-sanity";

import { dataset, projectId } from "../sanityEnv";

const studioUrl =
	process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? "http://localhost:3333";

type DataAttrConfig = CreateDataAttributeProps &
	Required<Pick<CreateDataAttributeProps, "id" | "type" | "path">>;

/**
 * Builds a `data-sanity` attribute value so the Presentation tool overlay can
 * map a rendered element back to its document + field path. Wrap editable
 * surfaces with `data-sanity={dataAttr({ id, type, path })}` — clicking the
 * element in Presentation jumps the Studio cursor straight into that field.
 *
 * `id` is the document `_id`, `type` is the document `_type`, `path` is the
 * dot-notated GROQ path to the field (e.g. `"modules[_key==\"abc\"].heading"`).
 */
export function dataAttr(config: DataAttrConfig): string {
	return createDataAttribute({
		projectId,
		dataset,
		baseUrl: studioUrl,
	})
		.combine(config)
		.toString();
}
