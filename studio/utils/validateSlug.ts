import type { Rule, SlugValue } from "sanity";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

/** The language ids, which the web serves as `/:locale`. */
const LANGUAGE_IDS = `*[_id == "siteLanguageSettings"][0].availableLanguages[].id`;

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
