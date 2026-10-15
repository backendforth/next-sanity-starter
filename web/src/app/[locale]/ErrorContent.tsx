import { pageContainerClassName } from "@/src/components/layout/containerStyles";
import { FOCUS_RING } from "@/src/components/navigation/navControlStyles";
import { uiLabel } from "@/src/i18n/uiLabels";

type Props = {
	locale: string;
	/** A plain `<a>`, so leaving the error reloads the document. */
	homeHref: string;
	/** The boundary's `reset`: renders the failed segment again. */
	onRetry: () => void;
};

/** The error boundaries' body: `[locale]/error.tsx` and `app/global-error.tsx`. */
export function ErrorContent({ locale, homeHref, onRetry }: Props) {
	return (
		<div className={pageContainerClassName}>
			<h2 className="heading-1">{uiLabel("errorTitle", locale)}</h2>
			<p className="text-color-text-muted">{uiLabel("errorBody", locale)}</p>
			<div className="flex gap-sm">
				<button
					onClick={onRetry}
					type="button"
					className={`inline-flex items-center justify-center rounded-md bg-color-brand px-sm py-xs text-color-bg hover:opacity-90 ${FOCUS_RING}`}
				>
					{uiLabel("retry", locale)}
				</button>
				<a
					href={homeHref}
					className={`inline-flex items-center justify-center rounded-md border border-color-border-subtle px-sm py-xs text-button text-color-text hover:bg-color-surface-muted ${FOCUS_RING}`}
				>
					{uiLabel("backHome", locale)}
				</a>
			</div>
		</div>
	);
}
