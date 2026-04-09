"use client";

import Link from "next/link";

import { cn } from "@/src/utils/cn";

import type { ResolvedNavRow } from "./navHref";

const defaultLinkClassName =
	"rounded-sm px-2 py-1.5 text-textColor underline-offset-4 transition-colors hover:text-linkColor focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentColor";

type Props = {
	row: ResolvedNavRow;
	onNavigate?: () => void;
	className?: string;
};

export function NavRowControl({ row, onNavigate, className }: Props) {
	const linkClassName = cn(defaultLinkClassName, className);

	if (row.kind === "button") {
		return (
			<button
				type="button"
				className={cn(linkClassName, "cursor-not-allowed opacity-60")}
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
				{...(row.blank ? { target: "_blank", rel: "noopener noreferrer" } : {})}
				onClick={onNavigate}
			>
				{row.label}
			</a>
		);
	}

	if (row.href.startsWith("#")) {
		return (
			<a href={row.href} className={linkClassName} onClick={onNavigate}>
				{row.label}
			</a>
		);
	}

	return (
		<Link href={row.href} className={linkClassName} onClick={onNavigate}>
			{row.label}
		</Link>
	);
}
