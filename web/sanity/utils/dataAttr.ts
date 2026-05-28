import {
	type CreateDataAttributeProps,
	createDataAttribute,
} from "next-sanity";

import { dataset, projectId } from "../sanityEnv";

const studioUrl =
	process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? "http://localhost:3333";

type DataAttrConfig = CreateDataAttributeProps &
	Required<Pick<CreateDataAttributeProps, "id" | "type">>;

/**
 * Builds a `data-sanity` attribute value so the Presentation tool overlay can
 * map a rendered element back to a Sanity document — optionally down to a
 * specific field. Wrap editable surfaces with
 * `data-sanity={dataAttr({ id, type })}` for document-level overlays, or pass
 * `path` to deep-link into a field (e.g. `"modules[_key==\"abc\"].heading"`).
 *
 * Branches use this differently:
 * - `variant/document-level` calls without `path` — each module's overlay opens
 *   the whole document (translations live as separate documents per locale).
 * - `main` (field-level i18n) passes the field path so clicks land in the
 *   right localized sub-field.
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
