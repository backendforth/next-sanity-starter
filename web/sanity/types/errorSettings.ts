import type { IntlRichTextEntry, IntlStringEntry } from "../utils";
import type { ContentModule } from "./modules";

export type ErrorSettingsDocument = {
	_id: string;
	notFoundTitle?: IntlStringEntry[] | null;
	notFoundBody?: IntlRichTextEntry[] | null;
	serverErrorTitle?: IntlStringEntry[] | null;
	serverErrorBody?: IntlRichTextEntry[] | null;
	modules?: ContentModule[] | null;
};
