import type { PortableTextBlock } from "@portabletext/types";

type LocalizedEntryValue = string | PortableTextBlock[] | null | undefined;

type LocalizedEntryBase<TValue extends LocalizedEntryValue> = {
  _key?: string;
  language?: string;
  value?: TValue;
};

export type IntlStringEntry = LocalizedEntryBase<string | null>;
export type IntlRichTextEntry = LocalizedEntryBase<PortableTextBlock[] | null>;
export type IntlTextEntry = LocalizedEntryBase<LocalizedEntryValue>;

function getLocaleCandidates(locale: string): string[] {
  const normalized = locale.trim();
  if (!normalized) {
    return [];
  }

  const base = normalized.split("-")[0];
  if (base && base !== normalized) {
    return [normalized, base];
  }
  return [normalized];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyPortableText(value: unknown): value is PortableTextBlock[] {
  return Array.isArray(value) && value.length > 0;
}

function hasUsableValue(value: LocalizedEntryValue): boolean {
  return isNonEmptyString(value) || isNonEmptyPortableText(value);
}

function pickPreferredEntry(
  entries: IntlTextEntry[],
  localeCandidates: string[],
): IntlTextEntry | undefined {
  for (const locale of localeCandidates) {
    const matched = entries.find(
      (entry) =>
        (entry.language === locale || entry._key === locale) &&
        hasUsableValue(entry.value),
    );
    if (matched) {
      return matched;
    }
  }
  return undefined;
}

function pickFallbackEntry(entries: IntlTextEntry[]): IntlTextEntry | undefined {
  return entries.find((entry) => hasUsableValue(entry.value));
}

function coerceResolvedValue(
  value: LocalizedEntryValue,
): string | PortableTextBlock[] | undefined {
  if (isNonEmptyString(value)) {
    return value.trim();
  }
  if (isNonEmptyPortableText(value)) {
    return value;
  }
  return undefined;
}

function resolveLocalizedEntries(
  entries: IntlTextEntry[] | null | undefined,
  locale: string,
): string | PortableTextBlock[] | undefined {
  if (!Array.isArray(entries) || entries.length === 0) {
    return undefined;
  }

  const localeCandidates = getLocaleCandidates(locale);
  const preferred = pickPreferredEntry(entries, localeCandidates);
  if (preferred) {
    return coerceResolvedValue(preferred.value);
  }

  const fallback = pickFallbackEntry(entries);
  return coerceResolvedValue(fallback?.value);
}

/**
 * Erkennt `sanity-plugin-internationalized-array`-Einträge (`language` / `_key` + `value`).
 * Nicht mit beliebigen Objekt-Arrays verwechseln: jedes Element braucht `value`.
 */
function looksLikeIntlEntryArray(value: unknown): value is IntlTextEntry[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }
  return value.every(
    (item) =>
      item != null &&
      typeof item === "object" &&
      "value" in item &&
      ("language" in item || "_key" in item),
  );
}

/**
 * Läuft rekursiv durch Objekte und Arrays und löst verschachtelte
 * `internationalizedArray*`-Felder auf (z. B. `module.text` im Rich Text, Links mit
 * lokalisierten Objekten), sodass die Ausgabe der einsprachigen Kette
 * `richtext → Blöcke → …` entspricht.
 */
function deepResolveLocalizedTree(value: unknown, locale: string): unknown {
  if (value == null) {
    return value;
  }

  if (looksLikeIntlEntryArray(value)) {
    const resolved = resolveLocalizedEntries(value, locale);
    if (resolved === undefined) {
      return undefined;
    }
    if (typeof resolved === "string") {
      return resolved;
    }
    if (Array.isArray(resolved)) {
      return resolved.map((item) => deepResolveLocalizedTree(item, locale));
    }
    return resolved;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepResolveLocalizedTree(item, locale));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as object)) {
      out[k] = deepResolveLocalizedTree(v, locale);
    }
    return out;
  }

  return value;
}

/**
 * Wählt die passende Locale für `internationalizedArrayRichText*` und löst alle
 * eingebetteten i18n-Felder in Blöcken, Mark-Defs und Modulen auf.
 */
export function resolveLocalizedPortableTextDeep(
  entries: IntlRichTextEntry[] | null | undefined,
  locale: string,
): PortableTextBlock[] {
  const raw = resolveLocalizedEntries(entries, locale);
  if (!Array.isArray(raw) || raw.length === 0) {
    return [];
  }
  return deepResolveLocalizedTree(raw, locale) as PortableTextBlock[];
}

export type ParseLocalizedTextOptions = {
  /** `internationalizedArray*` field value from Sanity */
  entries: IntlTextEntry[] | null | undefined;
  locale?: string;
  /**
   * - `auto` (default): string or Portable Text blocks, depending on the field
   * - `string`: only plain string (rich text resolves to `undefined`)
   * - `blocks`: only blocks (plain string resolves to `[]`)
   */
  as?: "auto" | "string" | "blocks";
};

export function parseLocalizedText(
  options: Omit<ParseLocalizedTextOptions, "as"> & { as?: "auto" },
): string | PortableTextBlock[] | undefined;
export function parseLocalizedText(
  options: ParseLocalizedTextOptions & { as: "string" },
): string | undefined;
export function parseLocalizedText(
  options: ParseLocalizedTextOptions & { as: "blocks" },
): PortableTextBlock[];
export function parseLocalizedText({
  entries,
  locale = "en",
  as = "auto",
}: ParseLocalizedTextOptions): string | PortableTextBlock[] | undefined | PortableTextBlock[] {
  const raw = resolveLocalizedEntries(entries, locale);

  if (as === "string") {
    return typeof raw === "string" ? raw : undefined;
  }

  if (as === "blocks") {
    if (!Array.isArray(raw) || raw.length === 0) {
      return [];
    }
    return deepResolveLocalizedTree(raw, locale) as PortableTextBlock[];
  }

  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return deepResolveLocalizedTree(raw, locale) as PortableTextBlock[];
  }
  return raw;
}
