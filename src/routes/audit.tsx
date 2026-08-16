import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill, riskTone } from "@/components/setu/badges";
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
      { title: "Audit Logs — SetuAI 2.0" },
      {
        name: "description",
        content:
          "Immutable, secret-free audit trail of every gateway decision: timestamp, user, department, action, risk level, result and reason.",
      },
      { property: "og:title", content: "Audit Logs — SetuAI 2.0" },
      {
        property: "og:description",
        content: "Auditable security trail containing metadata and reasons — never secret values.",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { user, events } = useSetu();
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
      <AppShell title="Audit Logs">
        <p className="rounded-lg border border-critical/40 bg-critical-soft p-6 text-sm text-critical">
          ACCESS DENIED. Audit logs are restricted to Security Officers and System Administrators.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Security Event & Audit Log"
      description="Metadata only. Credentials, OTPs and keys are never written to the log — only the fact of detection."
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <div className="space-y-1.5">
          <Label htmlFor="filter">Search events</Label>
          <Input id="filter" value={q} onChange={(e) => setQ(e.target.value)} placeholder="User, action, reason…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="level">Risk level</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger id="level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
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
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No events match this filter.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {new Date(e.timestamp).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>{e.userId}</TableCell>
                  <TableCell>{e.department}</TableCell>
                  <TableCell>{e.action}</TableCell>
                  <TableCell>
                    <StatusPill tone={riskTone(e.riskLevel)}>{e.riskLevel}</StatusPill>
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
