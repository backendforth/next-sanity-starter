import type { ReactNode } from "react";

/** One module, already rendered on the server, keyed for reordering. */
export type PrerenderedModule = {
	_key: string;
	/** Presentation click-to-edit path; Draft Mode only. */
	sanity?: string;
	rendered: ReactNode;
};

/**
 * The module stack markup. No directive: `ModulesRenderer` renders it on the server for
 * visitors, `ModulesRendererClient` on the client in Draft Mode — one DOM for both.
 */
export function ModulesStack({ modules }: { modules: PrerenderedModule[] }) {
	return (
		<div className="flex flex-col gap-lg">
			{/* `empty:hidden`: a module with nothing to show leaves no gap. */}
			{modules.map((m) => (
				<div key={m._key} data-sanity={m.sanity} className="empty:hidden">
					{m.rendered}
				</div>
			))}
		</div>
	);
}
