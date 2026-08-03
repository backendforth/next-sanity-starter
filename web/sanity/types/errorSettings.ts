import type { PortableTextBlock } from "@portabletext/types";

/** Shape of `errorSettingsQuery` — 404 / 500 copy; `modules[]` is not projected. */
export type ErrorSettingsDocument = {
	_id: string;
	language?: string | null;
	notFoundTitle?: string | null;
	notFoundBody?: PortableTextBlock[] | null;
	serverErrorTitle?: string | null;
	serverErrorBody?: PortableTextBlock[] | null;
};
