"use client";

import { useOptimistic } from "next-sanity/hooks";
import type { ReactNode } from "react";

export type PrerenderedModule = {
	_key: string;
	rendered: ReactNode;
};

type DocumentShape = {
	_id?: string;
	modules?: Array<{ _key?: string } | null | undefined> | null;
};

type Props = {
	documentId: string;
	initialModules: PrerenderedModule[];
};

/**
 * Client wrapper around the server-rendered module list. The modules
 * themselves stay RSC-rendered (passed in as `rendered` ReactNodes via
 * `initialModules`) so the client bundle does not balloon — this component
 * only orchestrates reordering when Sanity Visual Editing emits a document
 * update with a new `modules[]` order.
 *
 * Trade-off: modules newly added in the Studio do not appear optimistically
 * (we have no pre-rendered node for them); they show up after the next
 * `<SanityLive />` refetch. Reordering and deletion are instant.
 */
export function ModulesRendererClient({ documentId, initialModules }: Props) {
	const modules = useOptimistic<PrerenderedModule[], DocumentShape>(
		initialModules,
		(current, action) => {
			if (action.id !== documentId) return current;
			const next = action.document?.modules;
			if (!next?.length) return current;
			const reordered: PrerenderedModule[] = [];
			for (const m of next) {
				const key = m?._key;
				if (!key) continue;
				const known = current.find((c) => c._key === key);
				if (known) reordered.push(known);
			}
			return reordered.length > 0 ? reordered : current;
		},
	);

	return (
		<div className="flex flex-col gap-lg">
			{modules.map((m) => (
				<div key={m._key}>{m.rendered}</div>
			))}
		</div>
	);
}
