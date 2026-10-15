"use client";

import { useEffect } from "react";

import { useLanguage } from "@/src/contexts/LanguageContext";

import { ErrorContent } from "./ErrorContent";

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
		<ErrorContent
			locale={currentLocale}
			homeHref={localePath("/", currentLocale)}
			onRetry={reset}
		/>
	);
}
