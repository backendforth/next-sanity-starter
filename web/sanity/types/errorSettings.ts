import type { PortableTextBlock } from "@portabletext/types";

import type { ContentModule } from "./modules";

export type ErrorSettingsDocument = {
	_id: string;
	language?: string | null;
	notFoundTitle?: string | null;
	notFoundBody?: PortableTextBlock[] | null;
	serverErrorTitle?: string | null;
	serverErrorBody?: PortableTextBlock[] | null;
	modules?: ContentModule[] | null;
};
