import Link from "next/link";

import type { NotFoundCopy } from "@/sanity/types";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { uiLabel } from "@/src/i18n/uiLabels";

type Props = {
	/** `errorSettings`' 404 title and body for `locale` (`fetchSiteChrome(locale).notFound`). */
	copy: NotFoundCopy | null;
	locale: string;
	siteLocale: SiteLocaleConfig;
};

/** The 404 heading in `locale`: Studio copy, else the UI label. Also the tab title. */
export function notFoundTitle(
	copy: NotFoundCopy | null | undefined,
	locale: string,
): string {
	return copy?.notFoundTitle?.trim() || uiLabel("notFoundTitle", locale);
}

/** The 404 body in `locale`, rendered on the server: Studio copy, else the UI-label fallback. */
export function NotFoundContent({ copy, locale, siteLocale }: Props) {
	const title = notFoundTitle(copy, locale);
	const body = copy?.notFoundBody ?? [];
	const homeHref = createLanguagePathUtils(siteLocale).localePath("/", locale);

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
				<h2 className="page-title">{title}</h2>
				{body.length ? (
					<RichTextMedia value={body} locale={locale} siteLocale={siteLocale} />
				) : (
					<p className="text-color-text-muted">
						{uiLabel("notFoundBody", locale)}
					</p>
				)}
				<Link
					href={homeHref}
					className="inline-flex items-center gap-xs text-color-link hover:text-color-hover"
				>
					{uiLabel("backHome", locale)}
				</Link>
			</div>
		</div>
	);
}
