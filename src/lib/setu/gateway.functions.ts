import { createServerFn } from "@tanstack/react-start";
import { runGateway } from "./pipeline";
import { canViewRiskDetails, redactResultForRole } from "./authz";
import type { Language } from "./i18n";
import type { GatewayResult, Passport } from "./types";

/**
 * All AI/gateway processing happens server-side. The browser never talks to a
 * model provider directly and no provider key is ever exposed to the client.
 *
 * Authorisation is enforced HERE, not in the UI: internal risk intelligence is
 * removed from the payload before it is sent to a non-security role, so an
 * employee's browser never receives a risk score, level or risk factors.
 */
export const processQuery = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      query: string;
      passport: Passport;
      recentSensitiveCount: number;
      confidenceThreshold: number;
      language?: Language;
    }) => data,
  )
  .handler(async ({ data }): Promise<GatewayResult> => {
    const language: Language = data.language ?? "en";
    const result = runGateway({
      query: data.query,
      passport: data.passport,
      recentSensitiveCount: data.recentSensitiveCount,
      confidenceThreshold: data.confidenceThreshold,
      language,
    });

    // Translate only cleared, source-backed output (server-side model call).
    if (language !== "en" && result.outcome === "answered" && result.answer) {
      const { translateAnswer } = await import("./translate.server");
      result.answer = await translateAnswer(result.answer, language);
    }

    return redactResultForRole(result, data.passport.user.role);
  });

/**
 * Detailed security intelligence endpoint. Unauthorised roles receive a
 * 403 — the data is never serialised into their response.
 */
export const getRiskDetail = createServerFn({ method: "POST" })
  .inputValidator((data: { passport: Passport; query: string; recentSensitiveCount: number }) => data)
  .handler(async ({ data }) => {
    if (!canViewRiskDetails(data.passport.user.role)) {
      throw new Response("Forbidden — security analytics require Security Officer or Administrator authorisation", {
        status: 403,
      });
    }
    const result = runGateway({
      query: data.query,
      passport: data.passport,
      recentSensitiveCount: data.recentSensitiveCount,
      confidenceThreshold: 70,
      language: "en",
    });
    return { risk: result.risk, trace: result.trace, id: result.id, timestamp: result.timestamp };
  });
