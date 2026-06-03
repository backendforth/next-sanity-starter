"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

import type { MainMenuItem } from "@/sanity/types/nav";
import { CloseIcon } from "@/src/components/icons/CloseIcon";
import { HamburgerIcon } from "@/src/components/icons/HamburgerIcon";
import { ThemeToggle } from "@/src/components/theme/ThemeToggle";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { isCurrentNavHref } from "@/src/i18n/paths";
import {
	type MainMenuEntry,
	resolveMainMenuEntries,
} from "../../utils/navHref";
import { LanguageSwitch } from "./LanguageSwitch";
import { NavItem } from "./NavItem";
import { navLinkButtonClass } from "./navControlStyles";

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

/** Sole page `<h1>` — styled like a main-nav link (`navLinkButtonClass`). */
function SiteTitle({
	href,
	label,
	onClick,
}: {
	href: string;
	label: string;
	onClick?: () => void;
}) {
	const pathname = usePathname() ?? "/";
	const isHome = isCurrentNavHref(pathname, href, "");

	return (
		<h1 className="m-0 shrink-0 font-[inherit] text-[length:inherit] leading-[inherit]">
			<Link
				href={href}
				className={navLinkButtonClass(isHome)}
				aria-current={isHome ? "page" : undefined}
				onClick={onClick}
			>
				{label}
			</Link>
		</h1>
	);
}

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
			{entries.map((entry) => {
				if (entry.kind === "languageSwitch") {
					return (
						<LanguageSwitch
							key={entry.id}
							onAfterLocaleChange={onAfterLocaleChange}
						/>
					);
				}
				if (entry.kind === "themeToggle") {
					return <ThemeToggle key={entry.id} />;
				}
				return <NavItem key={entry.id} row={entry} onNavigate={onNavigate} />;
			})}
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
			className="inline-flex items-center justify-center rounded-sm p-min text-color-text hover:bg-color-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent md:hidden"
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
	const { currentLocale, localePath, siteLocale } = useLanguage();

	const entries = resolveMainMenuEntries(
		mainMenu,
		currentLocale,
		{ localePath },
		siteLocale,
	);
	const homeHref = localePath("/", currentLocale);
	/** From `siteSettings.title` via `fetchSiteSettingsTitle` (not `siteNav.title`). */
	const trimmedTitle = typeof siteTitle === "string" ? siteTitle.trim() : "";
	const brandLabel = trimmedTitle.length > 0 ? trimmedTitle : "Site";

	const [open, setOpen] = useState(false);
	const menuId = useId();

	const close = useCallback(() => setOpen(false), []);
	const closeMenuAfterLocaleChange = useCallback(() => setOpen(false), []);
	const toggle = useCallback(() => setOpen((v) => !v), []);

	useEscapeKey(open, close);

	if (!entries.length) {
		return (
			<header className="sticky top-0 z-50 border-b border-color-border-subtle bg-color-bg/95 backdrop-blur-sm">
				<div className="mx-auto flex w-full max-w-container items-center justify-between gap-sm px-md py-sm sm:px-container">
					<SiteTitle href={homeHref} label={brandLabel} />
				</div>
			</header>
		);
	}

	return (
		<header className="sticky top-0 z-50 border-b border-color-border-subtle bg-color-bg/95 backdrop-blur-sm">
			<div className="mx-auto flex w-full max-w-container items-center justify-between gap-sm px-md py-sm sm:px-container">
				<SiteTitle href={homeHref} label={brandLabel} onClick={close} />

				<div className="flex min-w-0 flex-1 items-center justify-end gap-xs sm:gap-sm">
					<nav
						className="hidden flex-wrap items-center justify-end gap-md md:flex"
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
						className="mx-auto flex max-w-container flex-col gap-md px-md py-sm sm:px-container"
						aria-label="Main"
					>
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
