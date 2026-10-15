import { randomBytes } from "node:crypto";
import {
  at,
  defineMigration,
  type MigrationContext,
  type NodePatch,
  set,
  unset,
} from "sanity/migrate";

/**
 * Moves content written for the old schema to the translatable one (`main`):
 *
 * - string `caption`s of `media.image` / `media.video` / `media.videoLoop`, wherever they sit;
 * - the cookie banner's texts;
 * - the banner's `sections` JSON (a `code` field) → `cookieSection` objects;
 * - `privacyPolicyUrl` + `privacyPolicyLabel` → the `privacyPolicy` link.
 *
 * A text becomes one entry for the default language (`siteLanguageSettings.defaultLanguageId`).
 * A banner text still equal to the old schema's English `initialValue` is unset instead: the web
 * shows that default in every language now. Values already in the new shape are skipped, so the
 * migration is safe to re-run. The export it reads includes drafts, so they are migrated too.
 *
 * How and when to run it: `scripts/README.md` → "Content migrations".
 */

type ValueType =
  | "internationalizedArrayStringValue"
  | "internationalizedArrayTextValue";

const STRING: ValueType = "internationalizedArrayStringValue";
const TEXT: ValueType = "internationalizedArrayTextValue";

const MEDIA_TYPES = new Set(["media.image", "media.video", "media.videoLoop"]);

/** The banner texts that became i18n fields: value type and the `initialValue` the old schema wrote. */
const BANNER_TEXTS: Record<
  "consentModal" | "preferencesModal",
  Record<string, [ValueType, string]>
> = {
  consentModal: {
    description: [
      TEXT,
      "Our website uses essential cookies for basic operation. Cookie-based analytics run only after you accept them; privacy-friendly analytics without cookies may load earlier.",
    ],
    acceptAllBtn: [STRING, "Accept"],
    acceptNecessaryBtn: [STRING, "Reject"],
    showPreferencesBtn: [STRING, "Manage preferences"],
  },
  preferencesModal: {
    title: [STRING, "Cookie preferences"],
    acceptAllBtn: [STRING, "Accept all"],
    acceptNecessaryBtn: [STRING, "Reject all"],
    savePreferencesBtn: [STRING, "Save preferences"],
  },
};

const OLD_PRIVACY_LABEL = "Privacy policy";

/** The old `sections` `initialValue`, parsed. */
const OLD_DEFAULT_SECTIONS = [
  {
    id: "necessary",
    title: "Strictly Necessary",
    description:
      "Essential for basic website functionality and cannot be disabled.",
    linkedCategory: "necessary",
    cookieTable: {
      headers: { name: "Name", domain: "Domain", desc: "Description" },
      body: [],
    },
  },
  {
    id: "analytics",
    title: "Analytics",
    description:
      "Helps us understand usage patterns and improve the website experience.",
    linkedCategory: "analytics",
    cookieTable: {
      headers: { name: "Name", domain: "Domain", desc: "Description" },
      body: [],
    },
  },
];

const CATEGORIES = new Set(["necessary", "analytics"]);

function newKey(): string {
  return randomBytes(16).toString("hex");
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** One entry for `language`, in the shape `sanity-plugin-internationalized-array` writes. */
function localized(
  value: string | undefined,
  valueType: ValueType,
  language: string,
) {
  return value
    ? [{ _key: newKey(), _type: valueType, language, value }]
    : undefined;
}

let defaultLanguage: Promise<string> | undefined;

function languageFor(context: MigrationContext): Promise<string> {
  defaultLanguage ??= context.client
    .fetch<{ id?: string; first?: string } | null>(
      `*[_id == "siteLanguageSettings"][0]{ "id": defaultLanguageId, "first": availableLanguages[0].id }`,
    )
    .then((settings) => {
      const id = settings?.id?.trim() || settings?.first?.trim();
      if (!id) {
        throw new Error(
          "siteLanguageSettings has no default language. Publish it in the Studio (Settings → Site languages), then run the migration again.",
        );
      }
      return id;
    });
  return defaultLanguage;
}

/**
 * The `sections` JSON. The `code` field kept it under `code`; its string `initialValue` was saved
 * as an object of single characters (`{ "0": "[", "1": "\n", … }`), which is joined back.
 */
function sectionsJson(value: Record<string, unknown>): string | undefined {
  if (typeof value.code === "string") return value.code;
  const indexes = Object.keys(value)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b));
  return indexes.length > 0
    ? indexes.map((index) => value[index]).join("")
    : undefined;
}

/** One vanilla-cookieconsent section → `cookieSection`; its `cookieTable.body` rows → `cookies[]`. */
function cookieSection(value: unknown, language: string) {
  const section = asRecord(value);
  if (!section) return [];
  const category =
    nonEmpty(section.linkedCategory) ??
    (section.id === "analytics" ? "analytics" : undefined);
  const rows = asRecord(section.cookieTable)?.body;
  const cookies = (Array.isArray(rows) ? rows : []).flatMap((value) => {
    const row = asRecord(value);
    const name = nonEmpty(row?.name);
    if (!row || !name) return [];
    return [
      {
        _key: newKey(),
        _type: "cookie",
        name,
        domain: nonEmpty(row.domain),
        description: localized(
          nonEmpty(row.desc) ?? nonEmpty(row.description),
          STRING,
          language,
        ),
      },
    ];
  });
  return [
    {
      _key: newKey(),
      _type: "cookieSection",
      title: localized(nonEmpty(section.title), STRING, language),
      description: localized(nonEmpty(section.description), TEXT, language),
      linkedCategory:
        category && CATEGORIES.has(category) ? category : undefined,
      cookies: cookies.length > 0 ? cookies : undefined,
    },
  ];
}

function report(id: string, message: string): void {
  console.warn(`[${id}] ${message}`);
}

async function migrateCookieBanner(
  doc: Record<string, unknown> & { _id: string },
  context: MigrationContext,
): Promise<NodePatch[]> {
  const language = await languageFor(context);
  const consent = asRecord(doc.consentModal);
  const preferences = asRecord(doc.preferencesModal);
  const patches: NodePatch[] = [];

  for (const [group, values] of [
    ["consentModal", consent],
    ["preferencesModal", preferences],
  ] as const) {
    for (const [field, [valueType, initialValue]] of Object.entries(
      BANNER_TEXTS[group],
    )) {
      const value = values?.[field];
      if (typeof value !== "string") continue;
      const text = value.trim();
      patches.push(
        at(
          [group, field],
          text && text !== initialValue
            ? set(localized(text, valueType, language))
            : unset(),
        ),
      );
    }
  }

  if (
    consent &&
    ("privacyPolicyUrl" in consent || "privacyPolicyLabel" in consent)
  ) {
    const url = nonEmpty(consent.privacyPolicyUrl);
    const label = nonEmpty(consent.privacyPolicyLabel);
    if (url && !consent.privacyPolicy) {
      if (/^https?:\/\//i.test(url)) {
        patches.push(
          at(
            ["consentModal", "privacyPolicy"],
            set({
              _type: "link",
              type: "external",
              url,
              blank: true,
              title:
                label && label !== OLD_PRIVACY_LABEL
                  ? localized(label, STRING, language)
                  : undefined,
            }),
          ),
        );
      } else {
        report(
          doc._id,
          `privacyPolicyUrl "${url}" is not an absolute URL, so it is dropped. Pick the page under Consent Modal Texts → Privacy Policy.`,
        );
      }
    }
    for (const field of ["privacyPolicyUrl", "privacyPolicyLabel"]) {
      if (field in consent) patches.push(at(["consentModal", field], unset()));
    }
  }

  const sections = preferences?.sections;
  const legacySections =
    typeof sections === "string" ? { code: sections } : asRecord(sections);
  if (legacySections) {
    const json = sectionsJson(legacySections);
    let parsed: unknown = [];
    try {
      if (json?.trim()) parsed = JSON.parse(json);
    } catch {
      parsed = undefined;
    }
    if (!Array.isArray(parsed)) {
      report(
        doc._id,
        "preferencesModal.sections is not a JSON array, so it is left as it is. Rebuild the sections in the Studio.",
      );
    } else if (
      parsed.length === 0 ||
      JSON.stringify(parsed) === JSON.stringify(OLD_DEFAULT_SECTIONS)
    ) {
      patches.push(at(["preferencesModal", "sections"], unset()));
    } else {
      patches.push(
        at(
          ["preferencesModal", "sections"],
          set(parsed.flatMap((section) => cookieSection(section, language))),
        ),
      );
    }
  }

  return patches;
}

export default defineMigration({
  title: "Translatable captions and cookie banner texts",
  migrate: {
    document(doc, context) {
      return doc._type === "siteCookieBanner"
        ? migrateCookieBanner(doc, context)
        : [];
    },
    async object(node, _path, context) {
      if (
        typeof node._type !== "string" ||
        !MEDIA_TYPES.has(node._type) ||
        typeof node.caption !== "string"
      ) {
        return;
      }
      const caption = node.caption.trim();
      return at(
        "caption",
        caption
          ? set(localized(caption, STRING, await languageFor(context)))
          : unset(),
      );
    },
  },
});
