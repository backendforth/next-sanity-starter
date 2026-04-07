import type { Rule, SlugValue } from "sanity";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
