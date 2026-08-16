import { POLICIES } from "./data";
import { canAccessDoc } from "./security";
import type { Citation, Passport, PolicyDoc, PolicyVersion } from "./types";

const STOPWORDS = new Set([
  "what","is","the","for","a","an","of","to","how","can","i","do","are","my","me","in","on","and",
  "please","tell","give","show","need","required","documents","about","apply","procedure","kya",
  "hai","ke","liye","mujhe","chahiye","માટે","કયા","શું",
]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export interface Retrieved {
  doc: PolicyDoc;
  version: PolicyVersion;
  score: number;
}

/** Picks the version effective at a given point in time (Policy Time Machine). */
export function versionAt(doc: PolicyDoc, when?: string | null): PolicyVersion {
  const current = doc.versions.find((v) => v.status === "Current") ?? doc.versions[0]!;
  if (!when) return current;
  const t = new Date(when).getTime();
  const match = doc.versions.find((v) => {
    const from = new Date(v.effectiveFrom).getTime();
    const to = v.effectiveTo ? new Date(v.effectiveTo).getTime() : Number.MAX_SAFE_INTEGER;
    return t >= from && t <= to;
  });
  return match ?? current;
}

/** Detects a historical time reference such as "in 2024" or "as of 2023". */
export function extractTimeReference(query: string): string | null {
  const m = query.match(/\b(?:in|during|as of|before|back in)\s+(19|20)(\d{2})\b/i);
  if (m) return `${m[1]}${m[2]}-06-30`;
  const y = query.match(/\b(20[0-2]\d)\b/);
  if (y && Number(y[1]) < new Date().getUTCFullYear()) return `${y[1]}-06-30`;
  return null;
}

export interface RetrievalOutcome {
  allowed: Retrieved[];
  deniedByRbac: PolicyDoc[];
}

export function retrieve(
  query: string,
  passport: Passport,
  when?: string | null,
): RetrievalOutcome {
  const tokens = tokenize(query);
  const scored: { doc: PolicyDoc; score: number }[] = [];

  for (const doc of POLICIES) {
    let score = 0;
    const haystack = `${doc.title} ${doc.category} ${doc.keywords.join(" ")}`.toLowerCase();
    const body = doc.versions.map((v) => v.content).join(" ").toLowerCase();
    for (const t of tokens) {
      if (doc.keywords.some((k) => k.includes(t) || t.includes(k))) score += 6;
      if (haystack.includes(t)) score += 3;
      if (body.includes(t)) score += 1;
    }
    if (score > 0) scored.push({ doc, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 4);
  const allowed: Retrieved[] = [];
  const deniedByRbac: PolicyDoc[] = [];

  for (const { doc, score } of top) {
    if (canAccessDoc(doc, passport)) {
      allowed.push({ doc, version: versionAt(doc, when), score });
    } else {
      deniedByRbac.push(doc);
    }
  }
  return { allowed, deniedByRbac };
}

export function toCitation(r: Retrieved): Citation {
  return {
    docId: r.doc.id,
    title: r.doc.title,
    circular: r.doc.circular,
    section: r.doc.section,
    version: r.version.version,
    lastUpdated: r.version.effectiveFrom,
    classification: r.doc.classification,
    excerpt: r.version.content.slice(0, 240) + (r.version.content.length > 240 ? "…" : ""),
  };
}

/**
 * Deterministic answer composer — the "model" behind the provider abstraction.
 * Replace this with a hosted LLM call without changing the gateway contract:
 * the gateway only ever hands it sanitised text and authorised context.
 */
export function composeAnswer(
  sanitizedQuery: string,
  retrieved: Retrieved[],
  historical: string | null,
): { answer: string; confidence: number } {
  if (!retrieved.length) {
    return {
      answer:
        "I could not find an authoritative policy source for this question in the knowledge available to your role. I will not answer government-policy questions without a citable source.",
      confidence: 0,
    };
  }
  const primary = retrieved[0]!;
  const tokens = tokenize(sanitizedQuery);
  const sentences = primary.version.content
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const ranked = sentences
    .map((s) => ({
      s,
      hits: tokens.filter((t) => s.toLowerCase().includes(t)).length,
    }))
    .sort((a, b) => b.hits - a.hits);

  const best = ranked.filter((r) => r.hits > 0).slice(0, 3).map((r) => r.s);
  const body = best.length ? best.join(" ") : sentences.slice(0, 2).join(" ");

  const coverage = Math.min(1, (ranked[0]?.hits ?? 0) / Math.max(2, tokens.length));
  const scoreFactor = Math.min(1, primary.score / 18);
  let confidence = Math.round(48 + coverage * 30 + scoreFactor * 20);
  if (retrieved.length > 1) confidence += 2;
  if (historical) confidence -= 6;
  confidence = Math.max(35, Math.min(97, confidence));

  const prefix = historical
    ? `As per the version of this policy that was in force on ${new Date(historical).toLocaleDateString("en-IN", { dateStyle: "medium" })}: `
    : "";

  return { answer: `${prefix}${body}`, confidence };
}
