import type { ReactNode } from "react";

/** One module, already rendered on the server, keyed for reordering. */
export type PrerenderedModule = {
	_key: string;
	/** Presentation click-to-edit path; Draft Mode only. */
	sanity?: string;
	rendered: ReactNode;
};

/**
 * A module with nothing to show is hidden, so it leaves no gap. A divider sits above every
 * shown module that follows another shown one; a sibling selector instead of `last:`, which
 * would keep a divider in front of a hidden last module.
 */
const stackItemClassName =
	"empty:hidden [:not(:empty)~&:not(:empty)]:border-t [:not(:empty)~&:not(:empty)]:border-color-border-subtle [:not(:empty)~&:not(:empty)]:pt-lg";

/**
 * The module stack markup. No directive: `ModulesRenderer` renders it on the server for
 * visitors, `ModulesRendererClient` on the client in Draft Mode — one DOM for both.
 */
export function ModulesStack({ modules }: { modules: PrerenderedModule[] }) {
	return (
		<div className="flex flex-col gap-lg">
			{modules.map((m) => (
				<div key={m._key} data-sanity={m.sanity} className={stackItemClassName}>
					{m.rendered}
				</div>
			))}
		</div>
	);
}
