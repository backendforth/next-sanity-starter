"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { isCurrentNavHref } from "@/src/i18n/paths";
import { cn } from "@/src/utils/cn";

import type { ResolvedNavRow } from "../../utils/navHref";
import { showCookiePreferences } from "../cookies/cookieConsentApi";
import { navLinkButtonClass } from "./navControlStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	row: ResolvedNavRow;
	onNavigate?: () => void;
	className?: string;
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/* `useSyncExternalStore` instead of reading `window.location` during render: the hydration
 * render uses the server snapshot (""), so server and client markup agree even when the URL
 * carries a #hash. The render-time read produced `aria-current` hydration mismatches for
 * scroll-to links; the real value applies right after hydration. */

function subscribeToHashChange(callback: () => void): () => void {
	window.addEventListener("hashchange", callback);
	return () => window.removeEventListener("hashchange", callback);
}

/** Hash fragment; updates on `hashchange`. Path changes re-read via `usePathname()` rerenders. */
function useLocationHash(): string {
	return useSyncExternalStore(
		subscribeToHashChange,
		() => window.location.hash,
		() => "",
	);
}

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

export function NavItem({ row, onNavigate, className }: Props) {
	const pathname = usePathname() ?? "/";
	const hash = useLocationHash();
	const origin = useLocationOrigin();

	const isActive =
		row.kind === "link" && isCurrentNavHref(pathname, row.href, hash, origin);

	const linkClassName = cn(navLinkButtonClass(isActive), className);

	const ariaCurrent = !isActive
		? undefined
		: row.href.startsWith("#")
			? ("location" as const)
			: ("page" as const);

	if (row.kind === "button") {
		if (row.action === "open-cookie-preferences") {
			return (
				<button
					type="button"
					className={cn(navLinkButtonClass(false), className)}
					onClick={() => {
						showCookiePreferences();
						onNavigate?.();
					}}
				>
					{row.label}
				</button>
			);
		}
		return (
			<button
				type="button"
				className={cn(
					navLinkButtonClass(false),
					"cursor-not-allowed opacity-60",
					className,
				)}
				disabled
				title="Modal link — not connected yet"
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

	if (row.href.startsWith("#")) {
		return (
			<a
				href={row.href}
				className={linkClassName}
				aria-current={ariaCurrent}
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
