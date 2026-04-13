export type { ModuleCarouselData } from "./carousel";
export type {
	ModuleContentRefsData,
	ModuleContentRefTarget,
} from "./contentRefs";
export type { ModuleMediaData, ResolvedMediaPayload } from "./media";
export type {
	SanityImageAssetRef,
	SanityImageDimensions,
	SanityImageField,
} from "./shared";
export type { ModuleTextData } from "./text";

import type { ModuleCarouselData } from "./carousel";
import type { ModuleContentRefsData } from "./contentRefs";
import type { ModuleMediaData } from "./media";
import type { ModuleTextData } from "./text";

export type ContentModule = {
	_type?: string;
	_key?: string;
} & Partial<ModuleTextData> &
	Partial<ModuleMediaData> &
	Partial<ModuleCarouselData> &
	Partial<ModuleContentRefsData>;
