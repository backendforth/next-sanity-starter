"use client";

import Link from "next/link";

import { cn } from "@/src/utils/cn";

import type { ResolvedNavRow } from "./navHref";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	row: ResolvedNavRow;
	onNavigate?: () => void;
	className?: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function NavRowControl({ row, onNavigate, className }: Props) {
	if (row.kind === "button") {
		return (
			<button
				type="button"
				className={cn(className, "rounded-sm px-2 py-1.5 text-color-text underline-offset-4 transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent cursor-not-allowed opacity-60")}
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
				className="rounded-sm px-2 py-1.5 text-color-text underline-offset-4 transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent"
				{...(row.blank ? { target: "_blank", rel: "noopener noreferrer" } : {})}
				onClick={onNavigate}
			>
				{row.label}
			</a>
		);
	}

	if (row.href.startsWith("#")) {
		return (
			<a href={row.href} className="rounded-sm px-2 py-1.5 text-color-text underline-offset-4 transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent" onClick={onNavigate}>
				{row.label}
			</a>
		);
	}

	return (
		<Link href={row.href} className="rounded-sm px-2 py-1.5 text-color-text underline-offset-4 transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent" onClick={onNavigate}>
			{row.label}
		</Link>
	);
}
