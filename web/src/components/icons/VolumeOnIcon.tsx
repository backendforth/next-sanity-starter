// ─── Component ───────────────────────────────────────────────────────────────

/** Speaker with waves — “sound on”. Pair with an accessible label on the control. */
export function VolumeOnIcon() {
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
			<path d="M16 8a5 5 0 0 1 0 8" />
			<path d="M19 5a9 9 0 0 1 0 14" />
		</svg>
	);
}
