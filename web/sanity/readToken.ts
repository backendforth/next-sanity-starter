import "server-only";

/**
 * `SANITY_API_READ_TOKEN`, trimmed (a pasted token often ends in a newline); `""` when unset.
 * Drafts for Draft Mode, Presentation and dev.
 */
export const readToken = process.env.SANITY_API_READ_TOKEN?.trim() ?? "";
