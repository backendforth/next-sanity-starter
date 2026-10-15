"use client";

import { useMemo, useState } from "react";

import {
	contentRefsFilterButtonClass,
	navControlGroupClass,
} from "@/src/components/navigation/navControlStyles";
import { uiLabel } from "@/src/i18n/uiLabels";

import { ContentRefList } from "./ContentRefList";
import type { ContentRefListItem } from "./ModuleContentRefs";

// ─── Types ───────────────────────────────────────────────────────────────────

/** `null`: the order the module delivers (the editor's picks, or newest first for "all"). */
type SortMode = "newest" | "az" | null;

type CategoryOption = ContentRefListItem["categories"][number];

type Props = {
	locale: string;
	items: ContentRefListItem[];
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

// ─── Component ───────────────────────────────────────────────────────────────

/** A project list: category filters (unless switched off) and sort controls over the grid. */
export function ModuleContentRefsClient({
	locale,
	items,
	showCategoryFilters,
	priority = false,
}: Props) {
	const [categoryId, setCategoryId] = useState<string | null>(null);
	const [sort, setSort] = useState<SortMode>(null);

	const categoryOptions = useMemo(
		() => (showCategoryFilters ? collectCategoryOptions(items, locale) : []),
		[showCategoryFilters, items, locale],
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

	return (
		<div className="flex flex-col gap-md">
			<div className="flex flex-col gap-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
				{categoryOptions.length > 0 ? (
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
								className={contentRefsFilterButtonClass(categoryId === cat.id)}
								aria-pressed={categoryId === cat.id}
								onClick={() => setCategoryId(cat.id)}
							>
								{cat.label}
							</button>
						))}
					</fieldset>
				) : null}
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
			</div>

			{visibleItems.length === 0 ? (
				<p className="text-small text-color-text-muted">
					{uiLabel("noItems", locale)}
				</p>
			) : (
				<ContentRefList items={visibleItems} priority={priority} />
			)}
		</div>
	);
}
