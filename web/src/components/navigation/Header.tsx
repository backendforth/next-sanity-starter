"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import type { NavMenuLink } from "@/sanity/types/nav";
import { CloseIcon } from "@/src/components/icons/CloseIcon";
import { HamburgerIcon } from "@/src/components/icons/HamburgerIcon";
import {
	type StudioLanguageOption,
	useLanguage,
} from "@/src/contexts/LanguageContext";
import type { AppLocale } from "@/src/i18n/config";
import { localePath } from "@/src/i18n/paths";
import type { ResolvedNavRow } from "../../utils/navHref";
import { resolveMainMenuRows } from "../../utils/navHref";
import { NavItem } from "./NavItem";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	mainMenu?: NavMenuLink[] | null;
	siteTitle?: string | null;
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useEscapeKey(enabled: boolean, onEscape: () => void) {
	useEffect(() => {
		if (!enabled) return;
		const handler = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [enabled, onEscape]);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavLinks({
	rows,
	onNavigate,
}: {
	rows: ResolvedNavRow[];
	onNavigate: () => void;
}) {
	return (
		<>
			{rows.map((row) => (
				<NavItem key={row.id} row={row} onNavigate={onNavigate} />
			))}
		</>
	);
}

function LanguageSelect({
	currentLocale,
	languages,
	onLanguageChange,
}: {
	currentLocale: AppLocale;
	languages: readonly StudioLanguageOption[];
	onLanguageChange: (next: AppLocale) => void;
}) {
	return (
		<select
			aria-label="Language"
			className="max-w-[min(100%,11rem)] cursor-pointer rounded-sm border border-color-border-subtle bg-color-bg py-1.5 pl-2 pr-8 text-sm text-color-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent"
			value={currentLocale}
			onChange={(e) => {
				onLanguageChange(e.target.value as AppLocale);
			}}
		>
			{languages.map((lang) => (
				<option key={lang.id} value={lang.id}>
					{lang.title}
				</option>
			))}
		</select>
	);
}

function MobileMenuButton({
	open,
	menuId,
	onToggle,
}: {
	open: boolean;
	menuId: string;
	onToggle: () => void;
}) {
	return (
		<button
			type="button"
			className="inline-flex items-center justify-center rounded-sm p-2 text-color-text hover:bg-color-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent md:hidden"
			aria-expanded={open}
			aria-controls={menuId}
			aria-label={open ? "Close menu" : "Open menu"}
			onClick={onToggle}
		>
			<span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
			{open ? <CloseIcon /> : <HamburgerIcon />}
		</button>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Header({ mainMenu, siteTitle }: Props) {
	const { currentLocale, languages, setLocale } = useLanguage();

	const rows = resolveMainMenuRows(mainMenu, currentLocale);
	const homeHref = localePath("/", currentLocale);
	const trimmedTitle = typeof siteTitle === "string" ? siteTitle.trim() : "";
	const brandLabel =
		trimmedTitle.length > 0 && trimmedTitle !== "Navigation"
			? trimmedTitle
			: "Site";

	const [open, setOpen] = useState(false);
	const menuId = useId();

	const onLanguageChange = useCallback(
		(next: AppLocale) => {
			setLocale(next);
			setOpen(false);
		},
		[setLocale],
	);

	const close = useCallback(() => setOpen(false), []);
	const toggle = useCallback(() => setOpen((v) => !v), []);

	useEscapeKey(open, close);

	if (!rows.length) {
		return (
			<header className="sticky top-0 z-50 border-b border-color-border-subtle bg-color-bg/95 backdrop-blur-sm">
				<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
					<Link
						href={homeHref}
						className="shrink-0 font-medium text-color-heading underline-offset-4 transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent"
					>
						{brandLabel}
					</Link>
					<LanguageSelect
						currentLocale={currentLocale}
						languages={languages}
						onLanguageChange={onLanguageChange}
					/>
				</div>
			</header>
		);
	}

	return (
		<header className="sticky top-0 z-50 border-b border-color-border-subtle bg-color-bg/95 backdrop-blur-sm">
			<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
				<Link
					href={homeHref}
					className="shrink-0 font-medium text-color-heading underline-offset-4 transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent"
					onClick={close}
				>
					{brandLabel}
				</Link>

				<div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
					<nav className="hidden items-center gap-1 md:flex" aria-label="Main">
						<NavLinks rows={rows} onNavigate={close} />
					</nav>

					<LanguageSelect
						currentLocale={currentLocale}
						languages={languages}
						onLanguageChange={onLanguageChange}
					/>

					<div className="flex md:hidden">
						<MobileMenuButton open={open} menuId={menuId} onToggle={toggle} />
					</div>
				</div>
			</div>

			{open ? (
				<div
					id={menuId}
					className="border-t border-color-border-subtle bg-color-bg md:hidden"
				>
					<nav
						className="mx-auto flex max-w-3xl flex-col gap-1 px-6 py-4 sm:px-8"
						aria-label="Main"
					>
						<NavLinks rows={rows} onNavigate={close} />
					</nav>
				</div>
			) : null}
		</header>
	);
}
