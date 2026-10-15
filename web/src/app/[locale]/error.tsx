"use client";

import { useEffect } from "react";

import { FOCUS_RING } from "@/src/components/navigation/navControlStyles";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { uiLabel } from "@/src/i18n/uiLabels";

export default function ErrorBoundary({
	error,
	reset,
}: {
	error: globalThis.Error & { digest?: string };
	reset: () => void;
}) {
	const { currentLocale, localePath } = useLanguage();

	useEffect(() => {
		console.error("Route error:", error);
	}, [error]);

	return (
		<div className="flex flex-col flex-1 bg-color-bg">
			<div className="mx-auto flex w-full max-w-container flex-1 flex-col gap-md px-md py-max sm:px-container">
				<h2 className="heading-1">{uiLabel("errorTitle", currentLocale)}</h2>
				<p className="text-color-text-muted">
					{uiLabel("errorBody", currentLocale)}
				</p>
				<div className="flex gap-sm">
					<button
						onClick={reset}
						type="button"
						className={`inline-flex items-center justify-center rounded-md bg-color-brand px-sm py-xs text-color-bg hover:opacity-90 ${FOCUS_RING}`}
					>
						{uiLabel("retry", currentLocale)}
					</button>
					<a
						href={localePath("/", currentLocale)}
						className={`inline-flex items-center justify-center rounded-md border border-color-border-subtle px-sm py-xs text-button text-color-text hover:bg-color-surface-muted ${FOCUS_RING}`}
					>
						{uiLabel("backHome", currentLocale)}
					</a>
				</div>
			</div>
		</div>
	);
}
