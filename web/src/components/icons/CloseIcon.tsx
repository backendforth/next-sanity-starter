// ─── Component ───────────────────────────────────────────────────────────────

/** X close icon; pair with an accessible label on the control (e.g. button). */
export function CloseIcon() {
	return (
		// biome-ignore lint/a11y/noSvgWithoutTitle: decorative; label on parent control
		<svg
			width={22}
			height={22}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<path d="M6 6l12 12M18 6L6 18" />
		</svg>
	);
}
