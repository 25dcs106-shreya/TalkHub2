import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { DEMO_USERS } from "@/lib/setu/data";
import type { DemoUser, RoleId } from "@/lib/setu/types";
import { DEPARTMENT_KEYS, ROLE_KEYS } from "@/lib/setu/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/setu/badges";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "User & Access Management — TalkHub" },
      {
        name: "description",
        content:
          "Administrator console for roles, clearance levels and department scope that drive every RBAC decision in the AI gateway.",
      },
      { property: "og:title", content: "User & Access Management — TalkHub" },
      {
        property: "og:description",
        content: "Manage roles and clearance levels behind the zero-trust gateway.",
      },
    ],
  }),
  component: UsersPage,
});

const ROLES: RoleId[] = ["employee", "hr_officer", "dept_officer", "security_officer", "admin"];

function UsersPage() {
  const { user, logEvent, t } = useSetu();
  const [people, setPeople] = useState<DemoUser[]>(DEMO_USERS);
  const [q, setQ] = useState("");

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <AppShell title={t("users.title")}>
        <p className="rounded-lg border border-critical/40 bg-critical-soft p-6 text-sm text-critical">
          {t("users.accessDenied")}
        </p>
      </AppShell>
    );
  }

  const shown = people.filter((p) =>
    `${p.name} ${p.employeeId} ${p.department} ${p.role}`.toLowerCase().includes(q.toLowerCase()),
  );

  const deptLabel = (d: string) => {
    const key = DEPARTMENT_KEYS[d];
    return key ? t(key) : d;
  };

  function update(id: string, patch: Partial<DemoUser>) {
    setPeople((list) => list.map((p) => (p.employeeId === id ? { ...p, ...patch } : p)));
    logEvent({
      userId: user!.employeeId,
      department: user!.department,
      action: "Access Change",
      riskLevel: "MEDIUM",
      result: "ALLOWED",
      reason: `Updated ${id}: ${Object.entries(patch)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(", ")}`,
    });
    toast.success(t("users.updated", { id }));
  }

  return (
    <AppShell title={t("users.title")} description={t("users.description")}>
      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="usearch">{t("users.searchLabel")}</Label>
        <Input
          id="usearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("users.searchPlaceholder")}
        />
      </div>

      <div className="mt-4 space-y-3">
        {shown.map((p) => (
          <Card key={p.employeeId}>
            <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_200px_160px]">
              <div>
                <p className="font-medium">
                  {p.name}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({p.employeeId})
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(ROLE_KEYS[p.role])} · {deptLabel(p.department)} ·{" "}
                  {t("users.device", { v: p.deviceTrust })}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill>{t("users.clearance", { n: p.clearance })}</StatusPill>
                  <StatusPill
                    tone={
                      p.role === "admin" ? "critical" : p.role === "employee" ? "safe" : "warn"
                    }
                  >
                    {t(ROLE_KEYS[p.role])}
                  </StatusPill>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`role-${p.employeeId}`} className="text-xs">
                  {t("users.roleLabel")}
                </Label>
                <Select
                  value={p.role}
                  onValueChange={(v) => update(p.employeeId, { role: v as RoleId })}
                >
                  <SelectTrigger id={`role-${p.employeeId}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(ROLE_KEYS[r])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`cl-${p.employeeId}`} className="text-xs">
                  {t("users.clearanceLabel")}
                </Label>
                <Select
                  value={String(p.clearance)}
                  onValueChange={(v) =>
                    update(p.employeeId, { clearance: Number(v) as DemoUser["clearance"] })
                  }
                >
                  <SelectTrigger id={`cl-${p.employeeId}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((l) => (
                      <SelectItem key={l} value={String(l)}>
                        {t("users.level", { n: l })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
