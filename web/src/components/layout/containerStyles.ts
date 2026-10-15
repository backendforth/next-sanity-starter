/** The site-width column with its side inset; header, footer and page bodies line up on it. */
export const containerClassName = "mx-auto w-full max-w-container px-container";

/**
 * A route's body, the direct child of `<main>`: fills the height left above the footer and
 * stacks its blocks `gap-md` apart.
 */
export const pageContainerClassName = `${containerClassName} flex flex-1 flex-col gap-md py-max`;
