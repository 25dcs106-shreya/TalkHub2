import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusPill, riskTone } from "@/components/setu/badges";
import type { ReviewTicket } from "@/lib/setu/types";
import { DEPARTMENT_KEYS, RISK_KEYS, TICKET_STATUS_KEYS } from "@/lib/setu/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Human Review Tickets — TalkHub" },
      {
        name: "description",
        content:
          "Track escalated questions. TalkHub informs; authorised human officers take the final decision on high-risk or low-confidence cases.",
      },
      { property: "og:title", content: "Human Review Tickets — TalkHub" },
      {
        property: "og:description",
        content: "Escalation workflow where authorised officers make the final decision.",
      },
    ],
  }),
  component: ReviewsPage,
});

const STATUSES: ReviewTicket["status"][] = [
  "Pending",
  "Assigned",
  "Under Review",
  "Resolved",
  "Rejected",
];

function ReviewsPage() {
  const { user, tickets, updateTicket, createTicket, t, locale } = useSetu();
  const [note, setNote] = useState<Record<string, string>>({});
  const [newQuestion, setNewQuestion] = useState("");
  if (!user) return null;

  const isOfficer = ["hr_officer", "dept_officer", "security_officer", "admin"].includes(user.role);
  const visible = isOfficer ? tickets : tickets.filter((tk) => tk.employeeId === user.employeeId);

  const statusLabel = (s: string) => t(TICKET_STATUS_KEYS[s] ?? "status.pending");
  const deptLabel = (d: string) => {
    const key = DEPARTMENT_KEYS[d];
    return key ? t(key) : d;
  };

  return (
    <AppShell
      title={isOfficer ? t("rev.titleQueue") : t("rev.titleMine")}
      description={t("rev.description")}
    >
      {!isOfficer && (
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("rev.newTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="newq">{t("rev.newLabel")}</Label>
            <Textarea
              id="newq"
              rows={3}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={t("rev.newPlaceholder")}
            />
            <Button
              disabled={!newQuestion.trim()}
              onClick={() => {
                const ticket = createTicket({
                  employeeId: user.employeeId,
                  employeeName: user.name,
                  department: user.department,
                  question: newQuestion.trim(),
                  riskLevel: "LOW",
                  aiAnswer: "(Raised directly by employee — no AI answer attached)",
                  sources: [],
                });
                setNewQuestion("");
                toast.success(t("rev.toastCreated", { id: ticket.id }));
              }}
            >
              {t("rev.submit")}
            </Button>
          </CardContent>
        </Card>
      )}

      {visible.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("rev.empty")}
        </p>
      )}

      <div className="space-y-3">
        {visible.map((tk) => (
          <Card key={tk.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{tk.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {tk.employeeName} ({tk.employeeId}) · {deptLabel(tk.department)} ·{" "}
                    {new Date(tk.createdAt).toLocaleString(locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isOfficer && (
                    <StatusPill tone={riskTone(tk.riskLevel)}>
                      {t("rev.risk", { level: t(RISK_KEYS[tk.riskLevel] ?? "risk.low") })}
                    </StatusPill>
                  )}
                  <StatusPill
                    tone={
                      tk.status === "Resolved"
                        ? "safe"
                        : tk.status === "Rejected"
                          ? "critical"
                          : "warn"
                    }
                  >
                    {statusLabel(tk.status)}
                  </StatusPill>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("rev.question")}
                </p>
                <p className="text-sm">{tk.question}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("rev.aiAnswer")}
                </p>
                <p className="text-sm text-muted-foreground">{tk.aiAnswer}</p>
              </div>
              {tk.sources.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("rev.sources", { list: tk.sources.join(", ") })}
                </p>
              )}
              {tk.officerNote && (
                <p className="rounded-md border border-safe/30 bg-safe-soft px-3 py-2 text-sm">
                  {t("rev.officerDecision", { note: tk.officerNote })}
                </p>
              )}

              {isOfficer && (
                <div className="grid gap-2 border-t pt-3 sm:grid-cols-[200px_1fr_auto]">
                  <Select
                    value={tk.status}
                    onValueChange={(v) => {
                      updateTicket(tk.id, { status: v as ReviewTicket["status"] });
                      toast.success(t("rev.toastStatus", { id: tk.id, status: statusLabel(v) }));
                    }}
                  >
                    <SelectTrigger aria-label={t("rev.statusAria", { id: tk.id })}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    rows={1}
                    placeholder={t("rev.notePlaceholder")}
                    aria-label={t("rev.noteAria", { id: tk.id })}
                    value={note[tk.id] ?? ""}
                    onChange={(e) => setNote((n) => ({ ...n, [tk.id]: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateTicket(tk.id, {
                        officerNote: note[tk.id] ?? "",
                        status: "Resolved",
                      });
                      toast.success(t("rev.toastResolved", { id: tk.id }));
                    }}
                  >
                    {t("rev.record")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
