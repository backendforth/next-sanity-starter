"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ErrorSettingsDocument } from "@/sanity/types/errorSettings";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import { useLanguage } from "@/src/contexts/LanguageContext";

type Props = {
	errorSettings: ErrorSettingsDocument | null;
};

export function LocaleNotFoundContent({ errorSettings }: Props) {
	const pathname = usePathname() ?? "/";
	const { localeFromPathname, localePath } = useLanguage();
	const locale = localeFromPathname(pathname);

	const title = errorSettings?.notFoundTitle?.trim() || "Page not found";
	const body = errorSettings?.notFoundBody ?? [];

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<main className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
				<h1 className="text-3xl font-bold">{title}</h1>
				{body.length ? (
					<RichTextMedia value={body} />
				) : (
					<p className="text-color-text-muted">
						The page you are looking for does not exist or has been moved.
					</p>
				)}
				<Link
					href={localePath("/", locale)}
					className="inline-flex items-center gap-2 text-color-link hover:underline"
				>
					Back to home
				</Link>
			</main>
		</div>
	);
}
