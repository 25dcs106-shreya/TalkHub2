import { createServerFn } from "@tanstack/react-start";
import { runGateway } from "./pipeline";
import type { GatewayResult, Passport } from "./types";

/**
 * All AI/gateway processing happens server-side. The browser never talks to a
 * model provider directly and no provider key is ever exposed to the client.
 */
export const processQuery = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      query: string;
      passport: Passport;
      recentSensitiveCount: number;
      confidenceThreshold: number;
    }) => data,
  )
  .handler(async ({ data }): Promise<GatewayResult> => {
    return runGateway({
      query: data.query,
      passport: data.passport,
      recentSensitiveCount: data.recentSensitiveCount,
      confidenceThreshold: data.confidenceThreshold,
    });
  });
