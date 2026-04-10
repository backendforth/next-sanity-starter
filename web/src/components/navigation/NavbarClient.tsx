"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import type { ResolvedNavRow } from "./navHref";
import { NavRowControl } from "./NavRowControl";

type Props = {
  rows: ResolvedNavRow[];
  homeHref: string;
  brandLabel: string;
};

export function NavbarClient({ rows, homeHref, brandLabel }: Props) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
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
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-color/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link
          href={homeHref}
          className="shrink-0 font-medium text-heading-color underline-offset-4 transition-colors hover:text-link-color focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-color"
          onClick={close}
        >
          {brandLabel}
        </Link>

        {rows.length > 0 ? (
          <>
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

            <div className="flex md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-sm p-2 text-text-color hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-color"
                aria-expanded={open}
                aria-controls={menuId}
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
          </>
        ) : null}
      </div>

      {rows.length > 0 && open ? (
        <div
          id={menuId}
          className="border-t border-border-subtle bg-bg-color md:hidden"
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
