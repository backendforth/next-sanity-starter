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

/** Page slugs share the site root with the web's own routes. */
export function validatePageSlug(rule: Rule) {
  return slugRule(rule, RESERVED_PAGE_SLUGS);
}
