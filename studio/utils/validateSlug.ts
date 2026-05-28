import type { Rule, SlugIsUniqueValidator, SlugValue } from "sanity";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Slug uniqueness scoped per `_type` AND `language`, so the same slug can
 * coexist on different language variants of the same document — required
 * under document-level translation (`@sanity/document-internationalization`).
 */
export const isUniqueLocaleAgnostic: SlugIsUniqueValidator = async (
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

export function validateSlug(rule: Rule) {
  return rule.required().custom((value: SlugValue | undefined) => {
    const current = value?.current?.trim();
    if (!current) {
      return "Slug is required";
    }
    if (!slugPattern.test(current)) {
      return "Use lowercase letters, numbers and hyphens only.";
    }
    return true;
  });
}
