import en from "@/locales/en/common.json";
import hi from "@/locales/hi/common.json";
import gu from "@/locales/gu/common.json";
import type { RoleId } from "./types";

export type Language = "en" | "hi" | "gu";

/**
 * Centralized i18n resources. All user-visible UI strings live in
 * src/locales/{en,hi,gu}/common.json — pages never hardcode translations.
 * The Record<StringKey, string> annotations make a missing Hindi or Gujarati
 * key a compile-time error.
 */
export type StringKey = keyof typeof en;

const HI: Record<StringKey, string> = hi;
const GU: Record<StringKey, string> = gu;

export const STRINGS: Record<Language, Record<StringKey, string>> = {
  en,
  hi: HI,
  gu: GU,
};

export type TranslateVars = Record<string, string | number>;

/**
 * Translate a key into the selected language with `{var}` interpolation.
 * Falls back to English, then to the key itself, so the UI never crashes
 * on a missing resource.
 */
export function translate(language: Language, key: StringKey, vars?: TranslateVars): string {
  const table = STRINGS[language] ?? STRINGS.en;
  const raw = table[key] ?? STRINGS.en[key] ?? String(key);
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : m,
  );
}

export const LANGUAGE_OPTIONS: { value: Language; label: string; speech: string }[] = [
  { value: "en", label: "English", speech: "en-IN" },
  { value: "hi", label: "हिन्दी", speech: "hi-IN" },
  { value: "gu", label: "ગુજરાતી", speech: "gu-IN" },
];

export function speechLocale(language: Language): string {
  return LANGUAGE_OPTIONS.find((l) => l.value === language)?.speech ?? "en-IN";
}

/** BCP-47 tag used for date/number formatting per selected language. */
export function localeTag(language: Language): string {
  return speechLocale(language);
}

export const LANGUAGE_NAME: Record<Language, string> = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
};

/**
 * Detects the language of a free-text query from its Unicode script.
 * Gujarati and Devanagari are unambiguous; anything else returns null so the
 * caller can fall back to the UI locale. Romanised Hindi ("Hinglish") has no
 * script signal and intentionally falls through to the locale.
 */
export function detectQueryLanguage(text: string): Language | null {
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return null;
}

// ---- Domain-value → translation-key mappings --------------------------------
// Data values (departments, categories, …) stay in English internally; these
// maps render them in the selected language without touching stored data.

export const ROLE_KEYS: Record<RoleId, StringKey> = {
  employee: "role.employee",
  hr_officer: "role.hr_officer",
  dept_officer: "role.dept_officer",
  security_officer: "role.security_officer",
  admin: "role.admin",
};

export const DEPARTMENT_KEYS: Record<string, StringKey> = {
  Personnel: "dept.personnel",
  Finance: "dept.finance",
  Revenue: "dept.revenue",
  "Home Affairs": "dept.homeAffairs",
  "Information Technology": "dept.it",
};

export const CATEGORY_KEYS: Record<string, StringKey> = {
  All: "cat.all",
  Leave: "cat.leave",
  Attendance: "cat.attendance",
  Payroll: "cat.payroll",
  LTC: "cat.ltc",
  Transfers: "cat.transfers",
  Recruitment: "cat.recruitment",
  Benefits: "cat.benefits",
  "Employee Welfare": "cat.welfare",
  "Department Policies": "cat.deptPolicies",
  "Government Schemes": "cat.govSchemes",
  Security: "cat.security",
};

export const CLASSIFICATION_KEYS: Record<string, StringKey> = {
  Public: "class.public",
  Internal: "class.internal",
  Restricted: "class.restricted",
  Confidential: "class.confidential",
};

export const TICKET_STATUS_KEYS: Record<string, StringKey> = {
  Pending: "status.pending",
  Assigned: "status.assigned",
  "Under Review": "status.underReview",
  Resolved: "status.resolved",
  Rejected: "status.rejected",
};

export const RISK_KEYS: Record<string, StringKey> = {
  LOW: "risk.low",
  MEDIUM: "risk.medium",
  HIGH: "risk.high",
  CRITICAL: "risk.critical",
};
