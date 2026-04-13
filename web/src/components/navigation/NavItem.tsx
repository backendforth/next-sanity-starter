"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useReducer } from "react";

import { isCurrentNavHref } from "@/src/i18n/paths";
import { cn } from "@/src/utils/cn";

import type { ResolvedNavRow } from "../../utils/navHref";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	row: ResolvedNavRow;
	onNavigate?: () => void;
	className?: string;
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Hash fragment; updates on `hashchange`. Path changes re-read via `usePathname()` rerenders. */
function useLocationHash(): string {
	const [, bumpHash] = useReducer((n: number) => n + 1, 0);
	useEffect(() => {
		window.addEventListener("hashchange", bumpHash);
		return () => window.removeEventListener("hashchange", bumpHash);
	}, []);
	return typeof window !== "undefined" ? window.location.hash : "";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NavItem({ row, onNavigate, className }: Props) {
	const pathname = usePathname() ?? "/";
	const hash = useLocationHash();

	const isActive =
		row.kind === "link" && isCurrentNavHref(pathname, row.href, hash);

	const linkClassName = cn(
		"rounded-sm px-2 py-1.5 underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent",
		!isActive && "text-color-text hover:text-color-link",
		className,
		isActive && "text-color-hover",
	);

	const ariaCurrent = !isActive
		? undefined
		: row.href.startsWith("#")
			? ("location" as const)
			: ("page" as const);

	if (row.kind === "button") {
		return (
			<button
				type="button"
				className={cn(
					className,
					"cursor-not-allowed rounded-sm px-2 py-1.5 text-color-text underline-offset-4 opacity-60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent",
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
