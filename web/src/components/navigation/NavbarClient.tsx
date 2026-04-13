"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { AppLocale } from "@/src/i18n/config";
import {
  localeFromPathname,
  localePath,
  pathWithoutLocalePrefix,
} from "@/src/i18n/paths";

import type { ResolvedNavRow } from "./navHref";
import { NavRowControl } from "./NavRowControl";

type LanguageOption = {
  id: AppLocale;
  title: string;
};

type Props = {
  rows: ResolvedNavRow[];
  homeHref: string;
  brandLabel: string;
  locale: AppLocale;
  languages: readonly LanguageOption[];
};

export function NavbarClient({
  rows,
  homeHref,
  brandLabel,
  locale,
  languages,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const fromPath = localeFromPathname(pathname);
  const currentLocale = languages.some((l) => l.id === fromPath)
    ? fromPath
    : locale;
  const pathWithoutLocale = pathWithoutLocalePrefix(pathname);

  const onLanguageChange = useCallback(
    (next: AppLocale) => {
      router.push(localePath(pathWithoutLocale, next));
      setOpen(false);
    },
    [pathWithoutLocale, router],
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

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
          {rows.length > 0 ? (
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Main"
            >
              {rows.map((row) => (
                <NavRowControl
                  key={row.id}
                  row={row}
                  onNavigate={close}
                />
              ))}
            </nav>
          ) : null}

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

          {rows.length > 0 ? (
            <div className="flex md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-sm p-2 text-color-text hover:bg-color-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((v) => !v)}
              >
                <span className="sr-only">
                  {open ? "Close menu" : "Open menu"}
                </span>
                {open ? (
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
                ) : (
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
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {rows.length > 0 && open ? (
        <div
          className="border-t border-color-border-subtle bg-color-bg md:hidden"
        >
          <nav
            className="mx-auto flex max-w-3xl flex-col gap-1 px-6 py-4 sm:px-8"
            aria-label="Main"
          >
            {rows.map((row) => (
              <NavRowControl
                key={row.id}
                row={row}
                onNavigate={close}
              />
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
