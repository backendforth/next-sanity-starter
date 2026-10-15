import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
	const mq = window.matchMedia(QUERY);
	mq.addEventListener("change", onChange);
	return () => mq.removeEventListener("change", onChange);
}

/** Live `prefers-reduced-motion: reduce`. `false` on the server and while hydrating. */
export function usePrefersReducedMotion(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(QUERY).matches,
		() => false,
	);
}
