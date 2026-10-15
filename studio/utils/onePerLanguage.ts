import type { DocumentRule } from "sanity";

/**
 * Document validation for the per-language singletons (`home`, `work`, the settings): the site
 * reads one document per type and language, so a second one in a language that already has a
 * published document can't be published. The structure lists every document of the type, and
 * its "+" can create such a duplicate.
 */
export function onePerLanguage(rule: DocumentRule) {
  return rule.custom(async (document, context) => {
    const language = document?.language;
    if (!document || typeof language !== "string" || !language) return true;
    const id = document._id.replace(/^drafts\./, "");
    const others = await context
      .getClient({ apiVersion: "2024-01-01" })
      .fetch<number>(
        `count(*[_type == $type && language == $language && !(_id in [$id, $draft]) && !(_id in path("drafts.**"))])`,
        { type: document._type, language, id, draft: `drafts.${id}` },
      );
    return others === 0
      ? true
      : `A published document of this type already exists in "${language}". The site shows one per language: edit that one instead.`;
  });
}
