// ─── Component ───────────────────────────────────────────────────────────────

/** Three-line menu icon; pair with an accessible label on the control (e.g. button). */
export function HamburgerIcon() {
	return (
		<svg
			width={22}
			height={22}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			aria-hidden
		>
			<path d="M4 7h16M4 12h16M4 17h16" />
		</svg>
	);
}
