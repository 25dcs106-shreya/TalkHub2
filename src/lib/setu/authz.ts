import type { GatewayResult, RoleId } from "./types";

/**
 * Roles authorised to see internal security intelligence: numeric risk score,
 * risk level, risk factors, anomaly indicators and raw gateway trace details.
 * Everyone else receives an employee-safe result with those fields removed
 * on the SERVER — they are never sent to an unauthorised browser.
 */
export const SECURITY_ROLES: RoleId[] = ["security_officer", "admin"];

export function canViewRiskDetails(role: RoleId | undefined | null): boolean {
  return Boolean(role && SECURITY_ROLES.includes(role));
}

/** Steps whose detail text carries internal security reasoning. */
const INTERNAL_STEPS = new Set([
  "Query Risk Engine",
  "Credential Scanner",
  "Prompt-Injection Filter",
]);

/**
 * Strips every internal security signal from a gateway result before it is
 * returned to a non-security role. This runs server-side; the payload the
 * employee's browser receives simply does not contain the data.
 */
export function redactResultForRole(result: GatewayResult, role: RoleId): GatewayResult {
  if (canViewRiskDetails(role)) return { ...result, riskVisible: true };
  const { risk: _risk, ...rest } = result;
  return {
    ...rest,
    riskVisible: false,
    trace: result.trace.map((step) =>
      INTERNAL_STEPS.has(step.step)
        ? {
            step: step.step,
            status: step.status,
            detail:
              step.status === "pass"
                ? "Check completed — no issue found"
                : "Protective action applied by the security gateway",
          }
        : step,
    ),
  };
}
