import type { Finding, Passport, PolicyDoc, RiskLevel, RoleId } from "./types";

/* ------------------------------------------------------------------ */
/* Credential detection                                                */
/* ------------------------------------------------------------------ */

const CREDENTIAL_RULES: { type: string; label: string; re: RegExp }[] = [
  {
    type: "password",
    label: "Password / passphrase disclosure",
    re: /\b(pass\s?word|passwd|pwd|paasword|pin\s?code)\b\s*(is|=|:|-)?\s*\S{3,}/i,
  },
  {
    type: "vpn",
    label: "VPN or network credential",
    re: /\bvpn\b[^.]{0,30}\b(password|passphrase|key|secret|credential)\b/i,
  },
  {
    type: "api_key",
    label: "API key or secret key",
    re: /\b(api[\s_-]?key|secret[\s_-]?key|client[\s_-]?secret)\b\s*(is|=|:)?\s*\S{6,}/i,
  },
  { type: "token", label: "Access / bearer token", re: /\b(bearer|access[\s_-]?token|jwt)\b\s*(is|=|:)?\s*[A-Za-z0-9._-]{10,}/i },
  { type: "token_literal", label: "Token-like high-entropy string", re: /\b(sk|pk|ghp|xox[baprs])[-_][A-Za-z0-9]{12,}\b/ },
  { type: "otp", label: "One-time password (OTP)", re: /\b(otp|one[\s-]?time\s?password)\b\s*(is|=|:)?\s*\d{4,8}\b/i },
  { type: "private_key", label: "Private key material", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    type: "db_credential",
    label: "Database connection credential",
    re: /\b(postgres|postgresql|mysql|mongodb)(\+srv)?:\/\/[^\s]+:[^\s]+@/i,
  },
  {
    type: "credential_combo",
    label: "Username + password combination",
    re: /\b(user(name)?|login|userid)\b\s*(is|=|:)\s*\S+[\s,;]+\b(pass\s?word|pwd|passwd)\b\s*(is|=|:)?\s*\S+/i,
  },
  { type: "secret_url", label: "Secret/internal URL with token", re: /https?:\/\/\S*(token|secret|key)=\S+/i },
];

export function detectCredentials(text: string): Finding[] {
  const out: Finding[] = [];
  for (const rule of CREDENTIAL_RULES) {
    const matches = text.match(new RegExp(rule.re.source, rule.re.flags.includes("g") ? rule.re.flags : rule.re.flags + "g"));
    if (matches && matches.length) {
      out.push({ type: rule.type, label: rule.label, severity: "CRITICAL", count: matches.length });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* PII detection + redaction                                           */
/* ------------------------------------------------------------------ */

const PII_RULES: { type: string; label: string; re: RegExp; severity: RiskLevel }[] = [
  { type: "aadhaar", label: "Aadhaar number", re: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g, severity: "HIGH" },
  { type: "pan", label: "PAN number", re: /\b[A-Z]{5}\d{4}[A-Z]\b/g, severity: "HIGH" },
  { type: "phone", label: "Phone number", re: /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g, severity: "MEDIUM" },
  { type: "email", label: "Email address", re: /\b[\w.%-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, severity: "MEDIUM" },
  { type: "bank_account", label: "Bank account number", re: /\b\d{11,18}\b/g, severity: "HIGH" },
  { type: "ifsc", label: "IFSC code", re: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g, severity: "MEDIUM" },
  { type: "employee_id", label: "Employee identifier", re: /\b(EMP|HRO|DPO|SEC|ADM)\d{3,6}\b/gi, severity: "LOW" },
  {
    type: "salary",
    label: "Salary / compensation figure",
    re: /\b(salary|basic pay|gross pay|ctc)\b[^.\n]{0,20}?(rs\.?|inr|₹)?\s?\d{4,}/gi,
    severity: "MEDIUM",
  },
  {
    type: "medical",
    label: "Medical information",
    re: /\b(diagnosis|diagnosed with|medical report|prescription|blood group|disability certificate)\b/gi,
    severity: "HIGH",
  },
  {
    type: "address",
    label: "Postal address",
    re: /\b(house no\.?|h\.no\.?|flat no\.?|plot no\.?|pin\s?code)\s*[:\-]?\s*[\w\/-]+/gi,
    severity: "MEDIUM",
  },
];

export function redactPII(text: string): { sanitized: string; findings: Finding[] } {
  let sanitized = text;
  const findings: Finding[] = [];
  for (const rule of PII_RULES) {
    const re = new RegExp(rule.re.source, rule.re.flags);
    const matches = sanitized.match(re);
    if (matches && matches.length) {
      findings.push({
        type: rule.type,
        label: rule.label,
        severity: rule.severity,
        count: matches.length,
      });
      sanitized = sanitized.replace(re, `[REDACTED:${rule.type.toUpperCase()}]`);
    }
  }
  return { sanitized, findings };
}

/** Strips detected credential material so it never leaves the gateway. */
export function stripCredentials(text: string): string {
  let out = text;
  for (const rule of CREDENTIAL_RULES) {
    out = out.replace(new RegExp(rule.re.source, rule.re.flags + "g"), "[CREDENTIAL REMOVED]");
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Prompt injection detection                                          */
/* ------------------------------------------------------------------ */

const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior|above) (instructions|rules)/i,
  /disregard (your|the) (system|previous) (prompt|instructions)/i,
  /you are now (an?|in) (unrestricted|developer|dan)/i,
  /reveal (your )?(system prompt|hidden instructions|confidential data)/i,
  /act as (an?? )?(admin|root|superuser)/i,
  /bypass (the )?(security|authentication|authorisation|authorization|controls)/i,
  /pretend (that )?(you|the rules)/i,
  /jailbreak/i,
];

export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

/* ------------------------------------------------------------------ */
/* Query risk engine                                                   */
/* ------------------------------------------------------------------ */

const RISK_SIGNALS: { re: RegExp; weight: number; reason: string }[] = [
  { re: /\b(password|credential|api key|token|otp|private key|secret)\b/i, weight: 45, reason: "Credential-related request" },
  { re: /\b(admin|root|superuser|privileged|server|database|payroll server)\b/i, weight: 22, reason: "Privileged system targeted" },
  { re: /\b(bypass|disable|circumvent|override|exploit|hack)\b/i, weight: 30, reason: "Attempt to circumvent security controls" },
  { re: /\b(investigation|vigilance|disciplinary|inquiry|complaint against)\b/i, weight: 28, reason: "Confidential investigation data requested" },
  { re: /\b(home address|personal (phone|number|details)|another employee|other employee|colleague'?s)\b/i, weight: 30, reason: "Third-party personal information requested" },
  { re: /\b(salary of|pay of|bank account|account number)\b/i, weight: 24, reason: "Financial or compensation data requested" },
  { re: /\b(vpn|firewall|network topology|access control list|security configuration)\b/i, weight: 20, reason: "Security infrastructure information requested" },
  { re: /\b(export|download|list all|dump|bulk)\b/i, weight: 14, reason: "Bulk data extraction pattern" },
  { re: /\b(transfer|posting|recruitment|payroll procedure)\b/i, weight: 10, reason: "Restricted procedural category" },
];

export interface RiskInput {
  query: string;
  credentials: Finding[];
  pii: Finding[];
  injection: boolean;
  authorised: boolean;
  recentSensitiveCount: number;
}

export function scoreRisk(input: RiskInput): { score: number; level: RiskLevel; reasons: string[] } {
  let score = 5;
  const reasons: string[] = [];

  for (const signal of RISK_SIGNALS) {
    if (signal.re.test(input.query)) {
      score += signal.weight;
      reasons.push(signal.reason);
    }
  }
  if (input.credentials.length) {
    score += 45;
    reasons.push("Sensitive credential material present in input");
  }
  if (input.pii.length) {
    score += 8 * Math.min(input.pii.length, 3);
    reasons.push("Personally identifiable information present in input");
  }
  if (input.injection) {
    score += 35;
    reasons.push("Prompt-injection pattern detected");
  }
  if (!input.authorised) {
    score += 20;
    reasons.push("User is not authorised for the requested knowledge scope");
  }
  if (input.recentSensitiveCount >= 2) {
    score += 10;
    reasons.push("Unusual query pattern in current session");
  }
  if (!reasons.length) reasons.push("Routine policy question within authorised scope");

  score = Math.max(3, Math.min(99, score));
  const level: RiskLevel =
    score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
  return { score, level, reasons };
}

/* ------------------------------------------------------------------ */
/* RBAC                                                                */
/* ------------------------------------------------------------------ */

const CLASSIFICATION_RANK: Record<string, number> = {
  Public: 1,
  Internal: 2,
  Restricted: 3,
  Confidential: 4,
};

export function canAccessDoc(doc: PolicyDoc, passport: Passport): boolean {
  const role: RoleId = passport.user.role;
  if (!doc.accessRoles.includes(role)) return false;
  if (passport.user.clearance < doc.minClearance) return false;
  const docRank = CLASSIFICATION_RANK[doc.classification] ?? 99;
  const userRank = CLASSIFICATION_RANK[passport.maxClassification] ?? 0;
  if (docRank > userRank) return false;
  return true;
}

/** Requests that are refused for everybody, regardless of role. */
export function absoluteRefusal(query: string): string | null {
  if (/\b(password|credential|api key|token|private key)\b/i.test(query) && /\b(give|tell|show|share|what is|need|send|reveal)\b/i.test(query))
    return "Access denied. Administrative or system credentials cannot be disclosed by SetuAI under any role or clearance level. If you require access, raise a request with your department's IT security desk.";
  if (/\b(bypass|circumvent|disable|override)\b[^.]{0,40}\b(authentication|security|access control|mfa|2fa|controls|firewall)\b/i.test(query))
    return "I cannot assist with bypassing security controls. If you are locked out or need an exception, the correct route is a documented exception request to your department's Information Security Officer.";
  if (/\b(home address|residential address|personal (phone|mobile|number)|private data)\b[^.]{0,40}\b(employee|colleague|officer|staff)\b/i.test(query) ||
      /\b(another|other|any) (employee|colleague|officer|staff)\b[^.]{0,40}\b(address|phone|salary|bank|aadhaar|personal)\b/i.test(query))
    return "I cannot provide personal information about another employee that you are not authorised to access. Verified requests for employee records must go through the Personnel Department with a recorded purpose.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Output security guard                                               */
/* ------------------------------------------------------------------ */

export function filterOutput(text: string): { text: string; filtered: boolean } {
  const cred = detectCredentials(text);
  const { sanitized, findings } = redactPII(text);
  const filtered = cred.length > 0 || findings.some((f) => f.severity === "HIGH");
  return { text: cred.length ? stripCredentials(sanitized) : sanitized, filtered };
}
