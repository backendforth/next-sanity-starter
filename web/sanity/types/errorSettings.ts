import type { IntlRichTextEntry, IntlStringEntry } from "../utils";

/** Shape of `errorSettingsQuery` — 404 / 500 copy; `modules[]` is not projected. */
export type ErrorSettingsDocument = {
	_id: string;
	notFoundTitle?: IntlStringEntry[] | null;
	notFoundBody?: IntlRichTextEntry[] | null;
	serverErrorTitle?: IntlStringEntry[] | null;
	serverErrorBody?: IntlRichTextEntry[] | null;
};
