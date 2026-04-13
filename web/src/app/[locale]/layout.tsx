import { notFound } from "next/navigation";

import { isAppLocale } from "@/src/i18n/config";

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;
	if (!isAppLocale(locale)) {
		notFound();
	}
	return children;
}
