import {
  getDraftId,
  getPublishedId,
  type Rule,
  type SlugIsUniqueValidator,
  type SlugValue,
} from "sanity";

import {
  LANGUAGE_IDS,
  PROJECT_URL_PREFIX,
} from "../config/presentation/conventions";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Slug uniqueness scoped per `_type` AND `language`, so the same slug can
 * coexist on different language variants of the same document — required
 * under document-level translation (`@sanity/document-internationalization`).
 *
 * The document's draft and published version don't count as others, whichever of its versions
 * is validated (`getPublishedId`). Release versions don't count at all: the Studio's client
 * reads raw, so every release's copy of this document would otherwise collide with it.
 */
export const isUniquePerLanguage: SlugIsUniqueValidator = async (
  slug,
  context,
) => {
  const { document, getClient } = context;
  if (!document) return true;
  const published = getPublishedId(document._id);
  const client = getClient({ apiVersion: "2024-01-01" });
  const params = {
    draft: getDraftId(published),
    published,
    slug,
    type: document._type,
    language: (document as { language?: string | null }).language ?? null,
  };
  const query = `count(*[
    _type == $type &&
    !(_id in [$draft, $published]) &&
    !(_id in path("versions.**")) &&
    slug.current == $slug &&
    language == $language
  ]) == 0`;
  return client.fetch(query, params);
};

/** First URL segments the web routes itself (`web/src/app/[locale]/work`): a page there is unreachable. */
const RESERVED_PAGE_SLUGS = new Set([PROJECT_URL_PREFIX.slice(1)]);

function slugRule(rule: Rule, reserved?: ReadonlySet<string>) {
  return rule.required().custom((value: SlugValue | undefined) => {
    const current = value?.current?.trim();
    if (!current) {
      return "Slug is required";
    }
    if (!slugPattern.test(current)) {
      return "Use lowercase letters, numbers and hyphens only.";
    }
    if (reserved?.has(current)) {
      return `"${current}" is a route of its own; pick another slug.`;
    }
    return true;
  });
}

export function validateSlug(rule: Rule) {
  return slugRule(rule);
}

/** Page slugs share the site root with the web's own routes and the language prefixes. */
export function validatePageSlug(rule: Rule) {
  return slugRule(rule, RESERVED_PAGE_SLUGS).custom(
    async (value: SlugValue | undefined, context) => {
      const current = value?.current?.trim();
      if (!current) return true;
      const languageIds = await context
        .getClient({ apiVersion: "2024-01-01" })
        .fetch<(string | null)[] | null>(LANGUAGE_IDS);
      return languageIds?.includes(current)
        ? `"${current}" is a language prefix; pick another slug.`
        : true;
    },
  );
}
