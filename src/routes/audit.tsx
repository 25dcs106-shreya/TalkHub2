import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill, riskTone } from "@/components/setu/badges";
import { DEPARTMENT_KEYS, RISK_KEYS } from "@/lib/setu/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Logs — TalkHub" },
      {
        name: "description",
        content:
          "Immutable, secret-free audit trail of every gateway decision: timestamp, user, department, action, risk level, result and reason.",
      },
      { property: "og:title", content: "Audit Logs — TalkHub" },
      {
        property: "og:description",
        content: "Auditable security trail containing metadata and reasons — never secret values.",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { user, events, t, locale } = useSetu();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("All");

  const rows = useMemo(
    () =>
      events.filter(
        (e) =>
          (level === "All" || e.riskLevel === level) &&
          (!q ||
            `${e.userId} ${e.department} ${e.action} ${e.reason} ${e.result}`
              .toLowerCase()
              .includes(q.toLowerCase())),
      ),
    [events, q, level],
  );

  if (!user) return null;
  if (!["security_officer", "admin"].includes(user.role)) {
    return (
      <AppShell title={t("audit.title")}>
        <p className="rounded-lg border border-critical/40 bg-critical-soft p-6 text-sm text-critical">
          {t("audit.accessDenied")}
        </p>
      </AppShell>
    );
  }

  const deptLabel = (d: string) => {
    const key = DEPARTMENT_KEYS[d];
    return key ? t(key) : d;
  };

  return (
    <AppShell title={t("audit.title")} description={t("audit.description")}>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <div className="space-y-1.5">
          <Label htmlFor="filter">{t("audit.searchLabel")}</Label>
          <Input
            id="filter"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("audit.searchPlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="level">{t("audit.riskLevel")}</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger id="level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "All" ? t("audit.all") : t(RISK_KEYS[l] ?? "risk.low")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mt-4">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("audit.timestamp")}</TableHead>
                <TableHead>{t("audit.user")}</TableHead>
                <TableHead>{t("audit.department")}</TableHead>
                <TableHead>{t("audit.action")}</TableHead>
                <TableHead>{t("audit.risk")}</TableHead>
                <TableHead>{t("audit.result")}</TableHead>
                <TableHead>{t("audit.reason")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {t("audit.noEvents")}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {new Date(e.timestamp).toLocaleString(locale)}
                  </TableCell>
                  <TableCell>{e.userId}</TableCell>
                  <TableCell>{deptLabel(e.department)}</TableCell>
                  <TableCell>{e.action}</TableCell>
                  <TableCell>
                    <StatusPill tone={riskTone(e.riskLevel)}>
                      {t(RISK_KEYS[e.riskLevel] ?? "risk.low")}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="font-medium">{e.result}</TableCell>
                  <TableCell className="max-w-[280px] text-sm text-muted-foreground">
                    {e.reason}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
