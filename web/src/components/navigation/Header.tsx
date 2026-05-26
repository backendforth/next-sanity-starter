"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import type { MainMenuItem } from "@/sanity/types/nav";
import { CloseIcon } from "@/src/components/icons/CloseIcon";
import { HamburgerIcon } from "@/src/components/icons/HamburgerIcon";
import { ThemeToggle } from "@/src/components/theme/ThemeToggle";
import { useLanguage } from "@/src/contexts/LanguageContext";
import {
	type MainMenuEntry,
	resolveMainMenuEntries,
} from "../../utils/navHref";
import { LanguageSwitch } from "./LanguageSwitch";
import { NavItem } from "./NavItem";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	mainMenu?: MainMenuItem[] | null;
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

function MainMenuItems({
	entries,
	onNavigate,
	onAfterLocaleChange,
}: {
	entries: MainMenuEntry[];
	onNavigate: () => void;
	onAfterLocaleChange: () => void;
}) {
	return (
		<>
			{entries.map((entry) =>
				entry.kind === "languageSwitch" ? (
					<LanguageSwitch
						key={entry.id}
						onAfterLocaleChange={onAfterLocaleChange}
					/>
				) : (
					<NavItem key={entry.id} row={entry} onNavigate={onNavigate} />
				),
			)}
		</>
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
	const { currentLocale, localePath } = useLanguage();

	const entries = resolveMainMenuEntries(mainMenu, currentLocale, {
		localePath,
	});
	const homeHref = localePath("/", currentLocale);
	const trimmedTitle = typeof siteTitle === "string" ? siteTitle.trim() : "";
	const brandLabel =
		trimmedTitle.length > 0 && trimmedTitle !== "Navigation"
			? trimmedTitle
			: "Site";

	const [open, setOpen] = useState(false);
	const menuId = useId();

	const close = useCallback(() => setOpen(false), []);
	const closeMenuAfterLocaleChange = useCallback(() => setOpen(false), []);
	const toggle = useCallback(() => setOpen((v) => !v), []);

	useEscapeKey(open, close);

	if (!entries.length) {
		return (
			<header className="sticky top-0 z-50 border-b border-color-border-subtle bg-color-bg/95 backdrop-blur-sm">
				<div className="mx-auto flex w-full max-w-container items-center justify-between gap-4 px-6 py-sm text-base sm:px-8">
					<Link
						href={homeHref}
						className="shrink-0 font-medium text-color-heading underline-offset-4 transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent"
					>
						{brandLabel}
					</Link>
					<ThemeToggle />
				</div>
			</header>
		);
	}

	return (
		<header className="sticky top-0 z-50 border-b border-color-border-subtle bg-color-bg/95 backdrop-blur-sm">
			<div className="mx-auto flex w-full max-w-container items-center justify-between gap-4 px-6 py-sm text-base sm:px-8">
				<Link
					href={homeHref}
					className="shrink-0 font-medium text-color-heading underline-offset-4 transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent"
					onClick={close}
				>
					{brandLabel}
				</Link>

				<div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
					<div className="hidden md:block">
						<ThemeToggle />
					</div>
					<nav
						className="hidden flex-wrap items-center justify-end gap-1 md:flex"
						aria-label="Main"
					>
						<MainMenuItems
							entries={entries}
							onNavigate={close}
							onAfterLocaleChange={closeMenuAfterLocaleChange}
						/>
					</nav>

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
						className="mx-auto flex max-w-container flex-col gap-3 px-6 py-sm text-base sm:px-8"
						aria-label="Main"
					>
						<div className="md:hidden">
							<ThemeToggle />
						</div>
						<MainMenuItems
							entries={entries}
							onNavigate={close}
							onAfterLocaleChange={closeMenuAfterLocaleChange}
						/>
					</nav>
				</div>
			) : null}
		</header>
	);
}
