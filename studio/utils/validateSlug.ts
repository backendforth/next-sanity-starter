import type { Rule, SlugIsUniqueValidator, SlugValue } from "sanity";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Slug uniqueness scoped per `_type` AND `language`, so the same slug can
 * coexist on different language variants of the same document — required
 * under document-level translation (`@sanity/document-internationalization`).
 */
export const isUniquePerLanguage: SlugIsUniqueValidator = async (
  slug,
  context,
) => {
  const { document, getClient } = context;
  if (!document) return true;
  const id = document._id.replace(/^drafts\./, "");
  const client = getClient({ apiVersion: "2024-01-01" });
  const params = {
    draft: `drafts.${id}`,
    published: id,
    slug,
    type: document._type,
    language: (document as { language?: string | null }).language ?? null,
  };
  const query = `count(*[
    _type == $type &&
    !(_id in [$draft, $published]) &&
    slug.current == $slug &&
    language == $language
  ]) == 0`;
  return client.fetch(query, params);
};

/** First URL segments the web routes itself (`web/src/app/[locale]/work`): a page there is unreachable. */
const RESERVED_PAGE_SLUGS = new Set(["work"]);

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

/** Page slugs share the site root with the web's own routes. */
export function validatePageSlug(rule: Rule) {
  return slugRule(rule, RESERVED_PAGE_SLUGS);
}
