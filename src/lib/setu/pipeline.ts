import { POLICIES, ROLE_SCOPES } from "./data";
import { composeAnswer, extractTimeReference, retrieve, toCitation } from "./rag";
import {
  absoluteRefusal,
  detectCredentials,
  detectInjection,
  filterOutput,
  redactPII,
  scoreRisk,
  stripCredentials,
} from "./security";
import { translate, type Language } from "./i18n";
import type { DemoUser, GatewayResult, GatewayTrace, Passport, RiskLevel } from "./types";

export function buildPassport(user: DemoUser, sessionRisk: RiskLevel = "LOW"): Passport {
  const scope = ROLE_SCOPES[user.role];
  const maxClassification =
    user.clearance >= 4 ? "Confidential" : user.clearance >= 3 ? "Restricted" : "Internal";
  return {
    user,
    sessionRisk,
    allowed: scope.allowed,
    restricted: scope.restricted,
    categories: scope.categories,
    maxClassification,
    issuedAt: new Date().toISOString(),
  };
}

export interface PipelineInput {
  query: string;
  passport: Passport;
  recentSensitiveCount: number;
  confidenceThreshold: number;
  language?: Language;
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * The Zero-Trust AI Gateway. Raw employee input never reaches the model:
 * it is scanned, sanitised, risk-scored and authorised first, and the model
 * output is guarded before it is returned.
 */
export function runGateway(input: PipelineInput): GatewayResult {
  const { query, passport } = input;
  const lang: Language = input.language ?? "en";
  const trace: GatewayTrace[] = [];
  const timestamp = new Date().toISOString();

  trace.push({
    step: "Identity & Role Verification",
    status: "pass",
    detail: `${passport.user.employeeId} · ${passport.user.roleLabel} · clearance L${passport.user.clearance}`,
  });
  trace.push({
    step: "Security Passport",
    status: "info",
    detail: `Max classification ${passport.maxClassification} · device ${passport.user.deviceTrust}`,
  });

  // 1. Credential scanner --------------------------------------------------
  const credentials = detectCredentials(query);
  const credSafeQuery = credentials.length ? stripCredentials(query) : query;
  trace.push({
    step: "Credential Scanner",
    status: credentials.length ? "block" : "pass",
    detail: credentials.length
      ? `${credentials.length} credential pattern(s) detected — value discarded, never stored or forwarded`
      : "No credential material detected",
  });

  // 2. PII scanner ---------------------------------------------------------
  const { sanitized, findings: redactions } = redactPII(credSafeQuery);
  trace.push({
    step: "PII Redaction",
    status: redactions.length ? "warn" : "pass",
    detail: redactions.length
      ? `Redacted: ${redactions.map((r) => r.label).join(", ")}`
      : "No personal identifiers detected",
  });

  // 3. Prompt injection ----------------------------------------------------
  const injection = detectInjection(query);
  trace.push({
    step: "Prompt-Injection Filter",
    status: injection ? "block" : "pass",
    detail: injection
      ? "Instruction-override attempt detected in untrusted input — ignored"
      : "Input treated as untrusted data; no override attempt found",
  });

  // 4. Retrieval scope / authorisation ------------------------------------
  const historical = extractTimeReference(query);
  const { allowed, deniedByRbac } = retrieve(sanitized, passport, historical);
  const authorised = deniedByRbac.length === 0;

  // 5. Risk engine ---------------------------------------------------------
  const risk = scoreRisk({
    query: sanitized,
    credentials,
    pii: redactions,
    injection,
    authorised,
    recentSensitiveCount: input.recentSensitiveCount,
  });
  trace.push({
    step: "Query Risk Engine",
    status: risk.level === "LOW" ? "pass" : risk.level === "MEDIUM" ? "warn" : "block",
    detail: `Score ${risk.score}/100 · ${risk.level}`,
  });

  const base = {
    id: id("Q"),
    sanitizedQuery: sanitized,
    redactions,
    credentials,
    injection,
    risk,
    trace,
    timestamp,
    outputFiltered: false,
    conflict: null,
    riskVisible: true,
    escalated: risk.level === "HIGH" || risk.level === "CRITICAL",
  };

  // Blocking outcome: credentials -----------------------------------------
  if (credentials.length) {
    trace.push({ step: "AI Model Call", status: "block", detail: "Request never forwarded to the model" });
    return {
      ...base,
      outcome: "blocked",
      securityStatus: "blocked",
      answer:
        lang !== "en"
          ? translate(lang, "chat.credentialBlocked")
          : "Sensitive credential material was detected in your message and has been blocked from reaching the AI system. The value was not stored or logged. Please reset the exposed credential if it is a live secret and contact your department security officer.",
      citations: [],
      confidence: 0,
      humanApprovalRequired: true,
    };
  }

  // Blocking outcome: absolute refusal / injection -------------------------
  const refusal = absoluteRefusal(sanitized);
  if (refusal || injection) {
    trace.push({ step: "AI Model Call", status: "block", detail: "Refused by policy before retrieval" });
    return {
      ...base,
      outcome: "denied",
      securityStatus: "blocked",
      answer:
        (lang !== "en" ? translate(lang, "chat.blockedGeneric") : null) ??
        refusal ??
        "This request attempts to override TalkHub's security instructions. Instructions embedded in user input or documents are treated as untrusted content and are never followed.",
      citations: [],
      confidence: 0,
      humanApprovalRequired: risk.level === "CRITICAL" || risk.level === "HIGH",
    };
  }

  // Blocking outcome: RBAC -------------------------------------------------
  if (!allowed.length && deniedByRbac.length) {
    const titles = deniedByRbac.map((d) => `${d.title} (${d.classification})`).join(", ");
    trace.push({
      step: "RBAC Authorisation",
      status: "block",
      detail: `Access denied to ${deniedByRbac.length} matching document(s) before retrieval`,
    });
    return {
      ...base,
      outcome: "denied",
      securityStatus: "blocked",
      answer: lang !== "en" ? s.blockedGeneric : `ACCESS DENIED. Your Security Passport (${passport.user.roleLabel}, clearance L${passport.user.clearance}) does not authorise the knowledge required to answer this question. Matching restricted material: ${titles}. If you have a legitimate official need, request human review and an authorised officer will handle it.`,
      citations: [],
      confidence: 0,
      humanApprovalRequired: true,
    };
  }

  trace.push({
    step: "RBAC Authorisation",
    status: deniedByRbac.length ? "warn" : "pass",
    detail: deniedByRbac.length
      ? `${allowed.length} authorised document(s); ${deniedByRbac.length} restricted document(s) excluded`
      : `${allowed.length} authorised document(s) in scope`,
  });

  // 6. Secure RAG + model --------------------------------------------------
  trace.push({
    step: "Secure RAG Retrieval",
    status: allowed.length ? "pass" : "warn",
    detail: allowed.length
      ? allowed.map((a) => `${a.doc.id} v${a.version.version}`).join(", ")
      : "No authoritative source matched",
  });

  const { answer, confidence } = composeAnswer(sanitized, allowed, historical);
  trace.push({
    step: "AI Model Call",
    status: "pass",
    detail: "Sanitised query + authorised context only (provider-abstracted)",
  });

  // 7. Output guard --------------------------------------------------------
  const guarded = filterOutput(answer);
  trace.push({
    step: "Output Security Guard",
    status: guarded.filtered ? "warn" : "pass",
    detail: guarded.filtered
      ? "Sensitive content redacted from model output"
      : "Output clean — no PII, credentials or restricted content",
  });

  const primaryDoc = allowed[0]?.doc;
  const conflict =
    primaryDoc?.conflict && /leave|casual|cl\b/i.test(sanitized) ? primaryDoc.conflict : null;

  const outcome = allowed.length ? "answered" : "no_source";
  const humanApprovalRequired =
    !allowed.length ||
    confidence < input.confidenceThreshold ||
    risk.level === "HIGH" ||
    risk.level === "CRITICAL" ||
    Boolean(conflict);

  return {
    ...base,
    outcome,
    securityStatus:
      guarded.filtered || redactions.length ? "protected" : "passed",
    answer: outcome === "no_source" && lang !== "en" ? translate(lang, "chat.noSource") : guarded.text,
    citations: allowed.map(toCitation),
    confidence,
    humanApprovalRequired,
    outputFiltered: guarded.filtered,
    conflict,
  };
}

export function policyById(docId: string) {
  return POLICIES.find((p) => p.id === docId);
}
