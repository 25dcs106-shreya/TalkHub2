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

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security Dashboard — SetuAI 2.0" },
      {
        name: "description",
        content:
          "Privacy-preserving security monitoring: query risk distribution, blocked requests, department usage and policy conflicts for authorised officers.",
      },
      { property: "og:title", content: "Security Dashboard — SetuAI 2.0" },
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
  const { user, events, tickets } = useSetu();

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
        day: day.toLocaleDateString("en-IN", { weekday: "short" }),
        events: events.filter((e) => e.timestamp.slice(0, 10) === key).length,
      };
    });
    return { byRisk, byDept, byDay };
  }, [events]);

  if (!user) return null;
  if (!["security_officer", "admin"].includes(user.role)) {
    return (
      <AppShell title="Security Dashboard">
        <p className="rounded-lg border border-critical/40 bg-critical-soft p-6 text-sm text-critical">
          ACCESS DENIED. This dashboard is restricted to Security Officers and System
          Administrators.
        </p>
      </AppShell>
    );
  }

  const blocked = events.filter((e) => e.result === "BLOCKED" || e.result === "DENIED").length;
  const sensitive = events.filter((e) => e.riskLevel !== "LOW").length;
  const conflicts = POLICIES.filter((p) => p.conflict).length;

  const cards = [
    { label: "Active users", value: 247 },
    { label: "Safe queries", value: 1842 + events.filter((e) => e.riskLevel === "LOW").length },
    { label: "Sensitive queries", value: sensitive },
    { label: "Blocked requests", value: blocked },
    { label: "Human reviews", value: tickets.length },
    { label: "Policy conflicts", value: conflicts },
    { label: "Security alerts", value: events.filter((e) => e.riskLevel === "CRITICAL").length },
  ];

  return (
    <AppShell
      title="Security Dashboard"
      description="Privacy-preserving security monitoring focused on protecting government information. No employee is accused automatically."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <p className="mt-2 text-2xl font-bold">{c.value.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Queries by risk level</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byRisk}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="level" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
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
            <CardTitle className="text-base">Security events over time</CardTitle>
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
            <CardTitle className="text-base">Department usage</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byDept} dataKey="queries" nameKey="department" outerRadius={90} label>
                  {data.byDept.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Latest security alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{e.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.userId} · {e.department} · {e.reason}
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
