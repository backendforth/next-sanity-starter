"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { isCurrentNavHref } from "@/src/i18n/paths";

import type { ResolvedNavRow } from "../../utils/navHref";
import { showCookiePreferences } from "../cookies/cookieConsentApi";
import { navLinkButtonClass } from "./navControlStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	row: ResolvedNavRow;
	onNavigate?: () => void;
	/** `muted` for the footer: muted text in both states. */
	tone?: "default" | "muted";
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

const subscribeNever = () => () => {};

/** Current origin, hydration-safe (`""` on the server and during hydration). */
function useLocationOrigin(): string {
	return useSyncExternalStore(
		subscribeNever,
		() => window.location.origin,
		() => "",
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NavItem({ row, onNavigate, tone = "default" }: Props) {
	const pathname = usePathname() ?? "/";
	const origin = useLocationOrigin();

	const isActive =
		row.kind === "link" && isCurrentNavHref(pathname, row.href, origin);

	const linkClassName = navLinkButtonClass(isActive, tone);

	const ariaCurrent = isActive ? ("page" as const) : undefined;

	if (row.kind === "button") {
		/* The only button action is the cookie-preferences opener. */
		return (
			<button
				type="button"
				className={navLinkButtonClass(false, tone)}
				onClick={() => {
					showCookiePreferences();
					onNavigate?.();
				}}
			>
				{row.label}
			</button>
		);
	}

	if (row.external) {
		return (
			<a
				href={row.href}
				className={linkClassName}
				aria-current={ariaCurrent}
				{...(row.blank ? { target: "_blank", rel: "noopener noreferrer" } : {})}
				onClick={onNavigate}
			>
				{row.label}
			</a>
		);
	}

	return (
		<Link
			href={row.href}
			className={linkClassName}
			aria-current={ariaCurrent}
			onClick={onNavigate}
		>
			{row.label}
		</Link>
	);
}
