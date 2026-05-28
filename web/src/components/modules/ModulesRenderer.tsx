import type {
	ContentModule,
	ModuleCarouselData,
	ModuleContentRefsData,
	ModuleMediaData,
	ModuleTextData,
} from "@/sanity/types/modules";
import { getSanityModuleLabel } from "@/sanity/utils/sanityModuleLabel";
import { ModuleMedia } from "./ModuleMedia";
import { ModuleText } from "./ModuleText";

type Props = {
	modules: ContentModule[];
};

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Carousel placeholder — schema + GROQ exist, no production renderer yet.
 * Renders a labeled placeholder in dev only; nothing in production so empty
 * Studio modules don't surface visible warnings to end users.
 */
function ModuleCarouselPlaceholder({ module }: { module: ModuleCarouselData }) {
	if (!IS_DEV) return null;
	const heading = module.heading?.trim() ?? "";
	const slideCount =
		module.resolvedSlides?.length ??
		module.slidesMedia?.length ??
		module.slides?.length ??
		0;
	return (
		<div className="rounded-md border border-dashed border-color-border-subtle p-4 text-sm text-color-text-muted">
			<strong className="block">module.carousel</strong>
			{heading ? <span className="block">heading: {heading}</span> : null}
			<span className="block">
				slides: {slideCount} (no frontend renderer yet)
			</span>
		</div>
	);
}

function ModuleContentRefsPlaceholder({
	module,
}: {
	module: ModuleContentRefsData;
}) {
	if (!IS_DEV) return null;
	const heading = module.heading?.trim() ?? "";
	const refCount = module.allowMultiple
		? (module.references?.length ?? 0)
		: module.reference
			? 1
			: 0;
	return (
		<div className="rounded-md border border-dashed border-color-border-subtle p-4 text-sm text-color-text-muted">
			<strong className="block">module.contentRefs</strong>
			{heading ? <span className="block">heading: {heading}</span> : null}
			<span className="block">
				references: {refCount} (no frontend renderer yet)
			</span>
		</div>
	);
}

function UnknownModule({ moduleType }: { moduleType: string | undefined }) {
	if (!IS_DEV) {
		console.warn(
			`[ModulesRenderer] No renderer for module type "${moduleType ?? "?"}". ` +
				"Add one in web/src/components/modules/ or remove the schema in studio/.",
		);
		return null;
	}
	return (
		<div className="rounded-md border border-dashed border-color-warning p-4 text-sm text-color-warning">
			<strong className="block">{getSanityModuleLabel(moduleType)}</strong>
			<span className="block">
				No frontend renderer for this module type yet.
			</span>
		</div>
	);
}

/** Renders the document `modules[]` stack (one UI block per `module.*` type). */
export function ModulesRenderer({ modules }: Props) {
	return (
		<div className="flex flex-col gap-10">
			{modules.map((mod, index) => {
				const key = mod._key ?? `${mod._type ?? "module"}-${index}`;
				if (mod._type === "module.text") {
					return <ModuleText key={key} module={mod as ModuleTextData} />;
				}
				if (mod._type === "module.media") {
					return <ModuleMedia key={key} module={mod as ModuleMediaData} />;
				}
				if (mod._type === "module.carousel") {
					return (
						<ModuleCarouselPlaceholder
							key={key}
							module={mod as ModuleCarouselData}
						/>
					);
				}
				if (mod._type === "module.contentRefs") {
					return (
						<ModuleContentRefsPlaceholder
							key={key}
							module={mod as ModuleContentRefsData}
						/>
					);
				}
				return <UnknownModule key={key} moduleType={mod._type} />;
			})}
		</div>
	);
}
