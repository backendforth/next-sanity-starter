import type { ReactNode } from "react";

/** One module, already rendered on the server, keyed for reordering. */
export type PrerenderedModule = {
	_key: string;
	rendered: ReactNode;
};

/**
 * The module stack markup. No directive: `ModulesRenderer` renders it on the server for
 * visitors, `ModulesRendererClient` on the client in Draft Mode — one DOM for both.
 */
export function ModulesStack({ modules }: { modules: PrerenderedModule[] }) {
	return (
		<div className="flex flex-col gap-lg">
			{modules.map((m) => (
				<div key={m._key}>{m.rendered}</div>
			))}
		</div>
	);
}
