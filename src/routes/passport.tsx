import { createFileRoute } from "@tanstack/react-router";
import { Check, X, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { canViewRiskDetails } from "@/lib/setu/authz";
import {
  CATEGORY_KEYS,
  CLASSIFICATION_KEYS,
  DEPARTMENT_KEYS,
  RISK_KEYS,
  ROLE_KEYS,
  type StringKey,
} from "@/lib/setu/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, riskTone } from "@/components/setu/badges";

export const Route = createFileRoute("/passport")({
  head: () => ({
    meta: [
      { title: "Security Passport — TalkHub" },
      {
        name: "description",
        content:
          "Your TalkHub Security Passport defines clearance, device trust, session risk and exactly which government knowledge the gateway may retrieve for you.",
      },
      { property: "og:title", content: "Security Passport — TalkHub" },
      {
        property: "og:description",
        content: "Clearance, device trust, session risk and authorised knowledge scope.",
      },
    ],
  }),
  component: PassportPage,
});

function PassportPage() {
  const { user, passport, sessionRisk, t, locale } = useSetu();
  if (!user || !passport) return null;

  const canSeeRisk = canViewRiskDetails(user.role);
  const deptKey = DEPARTMENT_KEYS[user.department];
  const classKey = CLASSIFICATION_KEYS[passport.maxClassification];

  const rows: [StringKey, string][] = [
    ["passport.rowEmployee", user.name],
    ["passport.rowEmployeeId", user.employeeId],
    ["passport.rowDepartment", deptKey ? t(deptKey) : user.department],
    ["passport.rowRole", t(ROLE_KEYS[user.role])],
    ["passport.rowClearance", t("passport.clearanceValue", { n: user.clearance })],
    ["passport.rowMaxClass", classKey ? t(classKey) : passport.maxClassification],
    ["passport.rowDeviceTrust", user.deviceTrust],
    ["passport.rowIssued", new Date(passport.issuedAt).toLocaleString(locale)],
  ];

  return (
    <AppShell title={t("passport.title")} description={t("passport.description")}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between border-b py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" aria-hidden /> {t("passport.details")}
            </CardTitle>
            {canSeeRisk ? (
              <StatusPill tone={riskTone(sessionRisk)}>
                {t("passport.sessionRisk", { level: t(RISK_KEYS[sessionRisk] ?? "risk.low") })}
              </StatusPill>
            ) : (
              <StatusPill tone="safe">{t("passport.sessionProtected")}</StatusPill>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <dl className="divide-y">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3">
                  <dt className="text-sm text-muted-foreground">{t(k)}</dt>
                  <dd className="text-sm font-medium sm:col-span-2">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("passport.categories")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {passport.categories.map((c) => {
              const key = CATEGORY_KEYS[c];
              return (
                <StatusPill key={c} tone="safe">
                  {key ? t(key) : c}
                </StatusPill>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base text-safe">{t("passport.allowed")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {passport.allowed.map((a) => (
              <p key={a} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-safe" aria-hidden />
                {a}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base text-critical">{t("passport.restricted")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {passport.restricted.map((a) => (
              <p key={a} className="flex items-start gap-2 text-sm">
                <X className="mt-0.5 size-4 shrink-0 text-critical" aria-hidden />
                {a}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("passport.enforcement")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{t("passport.step1")}</p>
            <p>{t("passport.step2")}</p>
            <p>{t("passport.step3")}</p>
            <p>{t("passport.step4")}</p>
            <p>{t("passport.step5")}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
