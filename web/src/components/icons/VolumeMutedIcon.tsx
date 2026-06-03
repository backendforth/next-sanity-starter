// ─── Component ───────────────────────────────────────────────────────────────

/** Speaker with X — “muted”. Pair with an accessible label on the control. */
export function VolumeMutedIcon() {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: decorative; label on parent control
		<svg
			width={22}
			height={22}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M5 10v4h3l5 4V6L8 10H5z" />
			<path d="M17 9l5 6M22 9l-5 6" />
		</svg>
	);
}
