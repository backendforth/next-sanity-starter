import { type DocumentRule, getPublishedId } from "sanity";

/**
 * Document validation for the per-language singletons (`home`, `work`, the settings): the site
 * reads one document per type and language, so a second one in a language that already has a
 * published document can't be published. The structure lists every document of the type, and
 * its "+" can create such a duplicate.
 *
 * Drafts and release versions count as the document they belong to (`getPublishedId`), and
 * only published documents count as others (`perspective: "published"`).
 */
export function onePerLanguage(rule: DocumentRule) {
  return rule.custom(async (document, context) => {
    const language = document?.language;
    if (!document || typeof language !== "string" || !language) return true;
    const others = await context
      .getClient({ apiVersion: "2024-01-01" })
      .fetch<number>(
        `count(*[_type == $type && language == $language && _id != $id])`,
        { type: document._type, language, id: getPublishedId(document._id) },
        { perspective: "published" },
      );
    return others === 0
      ? true
      : `A published document of this type already exists in "${language}". The site shows one per language: edit that one instead.`;
  });
}
