import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, riskTone } from "@/components/setu/badges";
import { POLICIES } from "@/lib/setu/data";
import { DEPARTMENT_KEYS, RISK_KEYS, type StringKey } from "@/lib/setu/i18n";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security Dashboard — TalkHub" },
      {
        name: "description",
        content:
          "Privacy-preserving security monitoring: query risk distribution, blocked requests, department usage and policy conflicts for authorised officers.",
      },
      { property: "og:title", content: "Security Dashboard — TalkHub" },
      {
        property: "og:description",
        content: "Risk analytics and security alerts for authorised security personnel.",
      },
    ],
  }),
  component: SecurityPage,
});

const RISK_COLORS: Record<string, string> = {
  LOW: "var(--safe)",
  MEDIUM: "var(--warn)",
  HIGH: "var(--high)",
  CRITICAL: "var(--critical)",
};

function SecurityPage() {
  const { user, events, tickets, t, locale } = useSetu();

  const data = useMemo(() => {
    const byRisk = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((level) => ({
      level,
      count: events.filter((e) => e.riskLevel === level).length,
    }));
    const byDept = Array.from(new Set(events.map((e) => e.department))).map((d) => ({
      department: d,
      queries: events.filter((e) => e.department === d).length,
    }));
    const byDay = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(Date.now() - (6 - i) * 86400000);
      const key = day.toISOString().slice(0, 10);
      return {
        day: day.toLocaleDateString(locale, { weekday: "short" }),
        events: events.filter((e) => e.timestamp.slice(0, 10) === key).length,
      };
    });
    return { byRisk, byDept, byDay };
  }, [events, locale]);

  if (!user) return null;
  if (!["security_officer", "admin"].includes(user.role)) {
    return (
      <AppShell title={t("sec.title")}>
        <p className="rounded-lg border border-critical/40 bg-critical-soft p-6 text-sm text-critical">
          {t("sec.accessDenied")}
        </p>
      </AppShell>
    );
  }

  const blocked = events.filter((e) => e.result === "BLOCKED" || e.result === "DENIED").length;
  const sensitive = events.filter((e) => e.riskLevel !== "LOW").length;
  const conflicts = POLICIES.filter((p) => p.conflict).length;

  const cards: { labelKey: StringKey; value: number }[] = [
    { labelKey: "sec.activeUsers", value: 247 },
    { labelKey: "sec.safeQueries", value: 1842 + events.filter((e) => e.riskLevel === "LOW").length },
    { labelKey: "sec.sensitiveQueries", value: sensitive },
    { labelKey: "sec.blockedRequests", value: blocked },
    { labelKey: "sec.humanReviews", value: tickets.length },
    { labelKey: "sec.policyConflicts", value: conflicts },
    { labelKey: "sec.securityAlerts", value: events.filter((e) => e.riskLevel === "CRITICAL").length },
  ];

  const deptLabel = (d: string) => {
    const key = DEPARTMENT_KEYS[d];
    return key ? t(key) : d;
  };

  return (
    <AppShell title={t("sec.title")} description={t("sec.description")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.labelKey}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t(c.labelKey)}
              </p>
              <p className="mt-2 text-2xl font-bold">{c.value.toLocaleString(locale)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("sec.chartRisk")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byRisk}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="level"
                  fontSize={12}
                  tickFormatter={(v: string) => t(RISK_KEYS[v] ?? "risk.low")}
                />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip
                  formatter={(value) => [value, t("sec.chartRisk")]}
                  labelFormatter={(v: string) => t(RISK_KEYS[v] ?? "risk.low")}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.byRisk.map((d) => (
                    <Cell key={d.level} fill={RISK_COLORS[d.level]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("sec.chartEvents")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.byDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="events" stroke="var(--chart-1)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("sec.chartDept")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byDept}
                  dataKey="queries"
                  nameKey="department"
                  outerRadius={90}
                  label={(props) => deptLabel(String((props as { name?: string }).name ?? ""))}
                >
                  {data.byDept.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, deptLabel(String(name))]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("sec.latestAlerts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.slice(0, 6).map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{e.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.userId} · {deptLabel(e.department)} · {e.reason}
                  </p>
                </div>
                <StatusPill tone={riskTone(e.riskLevel)}>{e.result}</StatusPill>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
