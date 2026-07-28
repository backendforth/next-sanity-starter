/**
 * Fallback while the locale segment loads (Suspense / navigation).
 *
 * `route-loading` (see `animations.css`) holds it invisible for 300 ms so
 * prefetched/ISR navigations never flash it — the skeleton → content swap was
 * a layout shift on every transition. Slow loads still get feedback after the
 * delay.
 */
export default function LocaleLoading() {
	return (
		<div
			className="route-loading mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<div className="h-9 w-48 animate-pulse rounded-md bg-color-surface-muted" />
			<div className="flex flex-col gap-sm">
				<div className="h-4 w-full max-w-2xl animate-pulse rounded bg-color-surface-muted" />
				<div className="h-4 w-full max-w-xl animate-pulse rounded bg-color-surface-muted" />
				<div className="h-4 w-full max-w-lg animate-pulse rounded bg-color-surface-muted" />
			</div>
		</div>
	);
}
