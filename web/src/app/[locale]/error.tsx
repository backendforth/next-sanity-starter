"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
	error,
	reset,
}: {
	error: globalThis.Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Route error:", error);
	}, [error]);

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
				<h1 className="text-3xl font-bold">Something went wrong</h1>
				<p className="text-color-text-muted">
					An unexpected error occurred. Please try again.
				</p>
				<div className="flex gap-4">
					<button
						onClick={reset}
						type="button"
						className="inline-flex items-center justify-center rounded-md bg-color-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-color-brand focus-visible:ring-offset-2"
					>
						Try again
					</button>
					<a
						href="/"
						className="inline-flex items-center justify-center rounded-md border border-color-border-subtle px-4 py-2 text-sm font-medium text-color-text hover:bg-color-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-color-brand focus-visible:ring-offset-2"
					>
						Back to home
					</a>
				</div>
			</main>
		</div>
	);
}
