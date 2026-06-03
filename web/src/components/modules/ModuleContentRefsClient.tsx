"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { ModuleContentRefListItem } from "@/sanity/types/modules/contentRefs";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import {
	MediaImage,
	PREVIEW_MAX_SRC_WIDTH,
	PREVIEW_SRCSET_WIDTHS,
} from "@/src/components/media/MediaImage";
import {
	contentRefsFilterButtonClass,
	contentRefsFilterGroupClass,
} from "@/src/components/navigation/navControlStyles";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { cn } from "@/src/utils/cn";

// ─── Types ───────────────────────────────────────────────────────────────────

type SortMode = "newest" | "az";

type CategoryOption = {
	id: string;
	label: string;
};

type Props = {
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
	items: ModuleContentRefListItem[];
	isProjectList: boolean;
	showCategoryFilters: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function targetTitle(
	target: ModuleContentRefListItem,
	locale: string,
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">,
): string {
	const title = pickLocalizedString(target?.title ?? null, locale, siteLocale);
	if (title) return title;
	const slug = target?.slug?.trim();
	if (slug) return slug;
	return "Untitled";
}

function sortKey(
	target: ModuleContentRefListItem,
	locale: string,
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">,
): string {
	return targetTitle(target, locale, siteLocale).toLocaleLowerCase(locale);
}

function createdAtMs(target: ModuleContentRefListItem): number {
	const raw = target?._createdAt;
	if (!raw) return 0;
	const ms = Date.parse(raw);
	return Number.isNaN(ms) ? 0 : ms;
}

function collectCategoryOptions(
	items: ModuleContentRefListItem[],
	locale: string,
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">,
): CategoryOption[] {
	const byId = new Map<string, string>();
	for (const item of items) {
		for (const cat of item?.categories ?? []) {
			const id = cat?._id;
			if (!id || byId.has(id)) continue;
			const label = pickLocalizedString(cat?.title ?? null, locale, siteLocale);
			if (label) byId.set(id, label);
		}
	}
	return [...byId.entries()]
		.map(([id, label]) => ({ id, label }))
		.sort((a, b) => a.label.localeCompare(b.label, locale));
}

function itemMatchesCategory(
	item: ModuleContentRefListItem,
	categoryId: string | null,
): boolean {
	if (!categoryId) return true;
	return (item?.categories ?? []).some((cat) => cat?._id === categoryId);
}

function ContentRefCardTitle({ label }: { label: string }) {
	return <h4 className="heading-4 mt-xs mb-xs">{label}</h4>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ModuleContentRefsClient({
	locale,
	siteLocale,
	items,
	isProjectList,
	showCategoryFilters,
}: Props) {
	const [categoryId, setCategoryId] = useState<string | null>(null);
	const [sort, setSort] = useState<SortMode>("newest");

	const categoryOptions = useMemo(
		() =>
			isProjectList && showCategoryFilters
				? collectCategoryOptions(items, locale, siteLocale)
				: [],
		[isProjectList, showCategoryFilters, items, locale, siteLocale],
	);

	const visibleItems = useMemo(() => {
		const filtered = items.filter((item) =>
			itemMatchesCategory(item, categoryId),
		);
		const sorted = [...filtered];
		if (sort === "az") {
			sorted.sort((a, b) =>
				sortKey(a, locale, siteLocale).localeCompare(
					sortKey(b, locale, siteLocale),
					locale,
				),
			);
		} else {
			sorted.sort((a, b) => createdAtMs(b) - createdAtMs(a));
		}
		return sorted;
	}, [items, categoryId, sort, locale, siteLocale]);

	const showFilters =
		isProjectList && showCategoryFilters && categoryOptions.length > 0;
	const showSort = isProjectList;

	return (
		<div className="content-refs-controls flex flex-col gap-md">
			{showFilters || showSort ? (
				<div className="flex flex-col gap-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
					{showFilters ? (
						<fieldset
							aria-label="Filter by category"
							className={cn(
								contentRefsFilterGroupClass,
								"m-0 min-w-0 border-0 p-0",
							)}
						>
							<button
								type="button"
								className={contentRefsFilterButtonClass(categoryId === null)}
								aria-pressed={categoryId === null}
								onClick={() => setCategoryId(null)}
							>
								All
							</button>
							{categoryOptions.map((cat) => (
								<button
									key={cat.id}
									type="button"
									className={contentRefsFilterButtonClass(
										categoryId === cat.id,
									)}
									aria-pressed={categoryId === cat.id}
									onClick={() => setCategoryId(cat.id)}
								>
									{cat.label}
								</button>
							))}
						</fieldset>
					) : null}
					{showSort ? (
						<fieldset
							aria-label="Sort projects"
							className={cn(
								contentRefsFilterGroupClass,
								"m-0 min-w-0 border-0 p-0",
							)}
						>
							<button
								type="button"
								className={contentRefsFilterButtonClass(sort === "newest")}
								aria-pressed={sort === "newest"}
								onClick={() => setSort("newest")}
							>
								Newest
							</button>
							<button
								type="button"
								className={contentRefsFilterButtonClass(sort === "az")}
								aria-pressed={sort === "az"}
								onClick={() => setSort("az")}
							>
								A–Z
							</button>
						</fieldset>
					) : null}
				</div>
			) : null}

			{visibleItems.length === 0 ? (
				<p className="text-small text-color-text-muted">No items to show.</p>
			) : (
				<ul className="content-refs-grid grid list-none gap-xs p-0 sm:grid-cols-2 lg:grid-cols-3">
					{visibleItems.map((item) => {
						const href = item.href;
						const label = targetTitle(item, locale, siteLocale);
						const key = item?._id ?? `${item?._type}-${item?.slug ?? label}`;
						const previewImage = item?.previewImage ?? null;
						const cardMedia = previewImage ? (
							<div className="relative aspect-4/3 overflow-hidden bg-color-surface-muted">
								<MediaImage
									imagePayload={previewImage}
									alt={label}
									fillParent
									objectFit="cover"
									className="!min-h-0"
									maxSrcWidth={PREVIEW_MAX_SRC_WIDTH}
									srcsetWidths={PREVIEW_SRCSET_WIDTHS}
									quality={75}
									sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
								/>
							</div>
						) : null;
						if (!href) {
							return (
								<li key={key} className="text-color-text-muted">
									{cardMedia}
									<ContentRefCardTitle label={label} />
								</li>
							);
						}
						return (
							<li key={key}>
								<Link
									href={href}
									className="block text-color-text transition-colors hover:text-color-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-accent"
								>
									{cardMedia}
									<ContentRefCardTitle label={label} />
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
