"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { MediaImage } from "@/src/components/media/MediaImage";
import {
	contentRefsFilterButtonClass,
	navControlGroupClass,
} from "@/src/components/navigation/navControlStyles";
import { uiLabel } from "@/src/i18n/uiLabels";

import type { ContentRefListItem } from "./ModuleContentRefs";

// ─── Types ───────────────────────────────────────────────────────────────────

/** `null`: the order the module delivers (the editor's picks, or newest first for "all"). */
type SortMode = "newest" | "az" | null;

type CategoryOption = ContentRefListItem["categories"][number];

type Props = {
	locale: string;
	items: ContentRefListItem[];
	isProjectList: boolean;
	showCategoryFilters: boolean;
	/** First module on the page — eager-load the first card image (LCP candidate). */
	priority?: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function collectCategoryOptions(
	items: ContentRefListItem[],
	locale: string,
): CategoryOption[] {
	const byId = new Map<string, CategoryOption>();
	for (const category of items.flatMap((item) => item.categories)) {
		if (!byId.has(category.id)) byId.set(category.id, category);
	}
	return [...byId.values()].sort((a, b) =>
		a.label.localeCompare(b.label, locale),
	);
}

function sortItems(
	items: ContentRefListItem[],
	sort: SortMode,
	locale: string,
): ContentRefListItem[] {
	if (sort === "az") {
		return [...items].sort((a, b) => a.label.localeCompare(b.label, locale));
	}
	if (sort === "newest") {
		return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}
	return items;
}

function ContentRefCardTitle({ label }: { label: string }) {
	return <h3 className="heading-4 mt-xs mb-xs">{label}</h3>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ModuleContentRefsClient({
	locale,
	items,
	isProjectList,
	showCategoryFilters,
	priority = false,
}: Props) {
	const [categoryId, setCategoryId] = useState<string | null>(null);
	const [sort, setSort] = useState<SortMode>(null);

	const categoryOptions = useMemo(
		() =>
			isProjectList && showCategoryFilters
				? collectCategoryOptions(items, locale)
				: [],
		[isProjectList, showCategoryFilters, items, locale],
	);

	const visibleItems = useMemo(
		() =>
			sortItems(
				categoryId
					? items.filter((item) =>
							item.categories.some((category) => category.id === categoryId),
						)
					: items,
				sort,
				locale,
			),
		[items, categoryId, sort, locale],
	);

	const showFilters =
		isProjectList && showCategoryFilters && categoryOptions.length > 0;
	const showSort = isProjectList;

	return (
		<div className="content-refs-controls flex flex-col gap-md">
			{showFilters || showSort ? (
				<div className="flex flex-col gap-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
					{showFilters ? (
						<fieldset
							aria-label={uiLabel("filterByCategory", locale)}
							className={navControlGroupClass}
						>
							<button
								type="button"
								className={contentRefsFilterButtonClass(categoryId === null)}
								aria-pressed={categoryId === null}
								onClick={() => setCategoryId(null)}
							>
								{uiLabel("filterAll", locale)}
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
							aria-label={uiLabel("sortProjects", locale)}
							className={navControlGroupClass}
						>
							<button
								type="button"
								className={contentRefsFilterButtonClass(sort === "newest")}
								aria-pressed={sort === "newest"}
								onClick={() => setSort("newest")}
							>
								{uiLabel("sortNewest", locale)}
							</button>
							<button
								type="button"
								className={contentRefsFilterButtonClass(sort === "az")}
								aria-pressed={sort === "az"}
								onClick={() => setSort("az")}
							>
								{uiLabel("sortAz", locale)}
							</button>
						</fieldset>
					) : null}
				</div>
			) : null}

			{visibleItems.length === 0 ? (
				<p className="text-small text-color-text-muted">
					{uiLabel("noItems", locale)}
				</p>
			) : (
				<ul className="content-refs-grid grid list-none gap-xs p-0 sm:grid-cols-2 lg:grid-cols-3">
					{visibleItems.map((item, index) => {
						const { key, href, label, previewImage } = item;
						const cardMedia = previewImage ? (
							<div className="relative aspect-4/3 overflow-hidden bg-color-surface-muted">
								<MediaImage
									imagePayload={previewImage}
									alt={label}
									fillParent
									objectFit="cover"
									quality={75}
									/* One column, `sm:` two, `lg:` three (`breakpoints.css`). */
									sizes="(max-width: 899px) 100vw, (max-width: 1439px) 50vw, 33vw"
									priority={priority && index === 0}
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
