import { randomBytes } from "node:crypto";
import {
  at,
  defineMigration,
  type NodePatch,
  set,
  unset,
} from "sanity/migrate";

/**
 * Moves every language's cookie banner to the typed schema (`variant/document-level`):
 *
 * - the `sections` JSON (a `code` field) → `cookieSection` objects;
 * - `privacyPolicyUrl` + `privacyPolicyLabel` → the `privacyPolicy` link;
 * - texts still equal to the old schema's English `initialValue` are unset, so each language's
 *   document shows the web's default in its own language.
 *
 * The texts stay plain: the language is the document's. Values already in the new shape are
 * skipped, so the migration is safe to re-run. The export it reads includes drafts, so they are
 * migrated too.
 *
 * How and when to run it: `scripts/README.md` → "Content migrations".
 */

/** The banner texts and the `initialValue` the old schema wrote. */
const OLD_INITIAL_TEXTS: Record<
  "consentModal" | "preferencesModal",
  Record<string, string>
> = {
  consentModal: {
    description:
      "Our website uses essential cookies for basic operation. Cookie-based analytics run only after you accept them; privacy-friendly analytics without cookies may load earlier.",
    acceptAllBtn: "Accept",
    acceptNecessaryBtn: "Reject",
    showPreferencesBtn: "Manage preferences",
  },
  preferencesModal: {
    title: "Cookie preferences",
    acceptAllBtn: "Accept all",
    acceptNecessaryBtn: "Reject all",
    savePreferencesBtn: "Save preferences",
  },
};

const OLD_PRIVACY_LABEL = "Privacy policy";

/**
 * `cookieBannerLabels.ts` → `privacyPolicy`; the web cannot be imported from here. A migrated
 * external link needs a title (the `link` type requires one), so without a custom label it gets
 * the default in the document's language.
 */
const POLICY_LABELS: Record<string, string> = {
  en: "Privacy policy",
  de: "Datenschutzerklärung",
  fr: "Politique de confidentialité",
  nl: "Privacybeleid",
};

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
function cookieSection(value: unknown) {
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
        description: nonEmpty(row.desc) ?? nonEmpty(row.description),
      },
    ];
  });
  return [
    {
      _key: newKey(),
      _type: "cookieSection",
      title: nonEmpty(section.title),
      description: nonEmpty(section.description),
      linkedCategory:
        category && CATEGORIES.has(category) ? category : undefined,
      cookies: cookies.length > 0 ? cookies : undefined,
    },
  ];
}

function report(id: string, message: string): void {
  console.warn(`[${id}] ${message}`);
}

function migrateCookieBanner(
  doc: Record<string, unknown> & { _id: string },
): NodePatch[] {
  const consent = asRecord(doc.consentModal);
  const preferences = asRecord(doc.preferencesModal);
  const patches: NodePatch[] = [];

  for (const [group, values] of [
    ["consentModal", consent],
    ["preferencesModal", preferences],
  ] as const) {
    for (const [field, initialValue] of Object.entries(
      OLD_INITIAL_TEXTS[group],
    )) {
      const value = values?.[field];
      if (typeof value === "string" && value.trim() === initialValue) {
        patches.push(at([group, field], unset()));
      }
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
                  ? label
                  : (POLICY_LABELS[String(doc.language)] ?? OLD_PRIVACY_LABEL),
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
          set(parsed.flatMap(cookieSection)),
        ),
      );
    }
  }

  return patches;
}

export default defineMigration({
  title: "Typed cookie banner sections and privacy link",
  documentTypes: ["siteCookieBanner"],
  migrate: {
    document(doc) {
      return migrateCookieBanner(doc);
    },
  },
});
