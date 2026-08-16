import { createFileRoute } from "@tanstack/react-router";
import { Check, X, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { ROLE_LABELS } from "@/lib/setu/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, riskTone } from "@/components/setu/badges";

export const Route = createFileRoute("/passport")({
  head: () => ({
    meta: [
      { title: "Security Passport — SetuAI 2.0" },
      {
        name: "description",
        content:
          "Your SetuAI Security Passport defines clearance, device trust, session risk and exactly which government knowledge the gateway may retrieve for you.",
      },
      { property: "og:title", content: "Security Passport — SetuAI 2.0" },
      {
        property: "og:description",
        content: "Clearance, device trust, session risk and authorised knowledge scope.",
      },
    ],
  }),
  component: PassportPage,
});

function PassportPage() {
  const { user, passport, sessionRisk } = useSetu();
  if (!user || !passport) return null;

  const rows = [
    ["Employee", user.name],
    ["Employee ID", user.employeeId],
    ["Department", user.department],
    ["Role", `${ROLE_LABELS[user.role]} (${user.roleLabel})`],
    ["Clearance", `Level ${user.clearance}`],
    ["Max classification", passport.maxClassification],
    ["Device trust", user.deviceTrust],
    ["Passport issued", new Date(passport.issuedAt).toLocaleString("en-IN")],
  ];

  return (
    <AppShell
      title="Security Passport"
      description="Issued at sign-in and enforced on every query before retrieval — not by the model."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between border-b py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" aria-hidden /> Passport details
            </CardTitle>
            <StatusPill tone={riskTone(sessionRisk)}>Session risk {sessionRisk}</StatusPill>
          </CardHeader>
          <CardContent className="p-0">
            <dl className="divide-y">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3">
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium sm:col-span-2">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Authorised categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {passport.categories.map((c) => (
              <StatusPill key={c} tone="safe">
                {c}
              </StatusPill>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base text-safe">Allowed</CardTitle>
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
            <CardTitle className="text-base text-critical">Restricted</CardTitle>
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
            <CardTitle className="text-base">How this is enforced</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Identity and role are verified before a passport is issued.</p>
            <p>2. Input is scanned for credentials and PII; unsafe material never leaves the gateway.</p>
            <p>3. Authorisation is evaluated before documents are retrieved — not by the model.</p>
            <p>4. Output is guarded again before it reaches your screen.</p>
            <p>5. Every decision is written to an auditable, secret-free security log.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
