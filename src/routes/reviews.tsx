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
      { title: "Human Review Tickets — SetuAI 2.0" },
      {
        name: "description",
        content:
          "Track escalated questions. SetuAI informs; authorised human officers take the final decision on high-risk or low-confidence cases.",
      },
      { property: "og:title", content: "Human Review Tickets — SetuAI 2.0" },
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
  const { user, tickets, updateTicket, createTicket } = useSetu();
  const [note, setNote] = useState<Record<string, string>>({});
  const [newQuestion, setNewQuestion] = useState("");
  if (!user) return null;

  const isOfficer = ["hr_officer", "dept_officer", "security_officer", "admin"].includes(user.role);
  const visible = isOfficer ? tickets : tickets.filter((t) => t.employeeId === user.employeeId);

  return (
    <AppShell
      title={isOfficer ? "Human Review Queue" : "My Review Requests"}
      description="AI provides information. An authorised human officer makes the final decision."
    >
      {!isOfficer && (
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Raise a new review request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="newq">Your question for an authorised officer</Label>
            <Textarea
              id="newq"
              rows={3}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Describe what you need clarified. Do not include passwords or personal identifiers."
            />
            <Button
              disabled={!newQuestion.trim()}
              onClick={() => {
                const t = createTicket({
                  employeeId: user.employeeId,
                  employeeName: user.name,
                  department: user.department,
                  question: newQuestion.trim(),
                  riskLevel: "LOW",
                  aiAnswer: "(Raised directly by employee — no AI answer attached)",
                  sources: [],
                });
                setNewQuestion("");
                toast.success(`Ticket ${t.id} created`);
              }}
            >
              Submit request
            </Button>
          </CardContent>
        </Card>
      )}

      {visible.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No review tickets yet. Escalate an answer from the assistant to create one.
        </p>
      )}

      <div className="space-y-3">
        {visible.map((t) => (
          <Card key={t.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{t.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.employeeName} ({t.employeeId}) · {t.department} ·{" "}
                    {new Date(t.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={riskTone(t.riskLevel)}>Risk {t.riskLevel}</StatusPill>
                  <StatusPill tone={t.status === "Resolved" ? "safe" : t.status === "Rejected" ? "critical" : "warn"}>
                    {t.status}
                  </StatusPill>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Question
                </p>
                <p className="text-sm">{t.question}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  AI answer
                </p>
                <p className="text-sm text-muted-foreground">{t.aiAnswer}</p>
              </div>
              {t.sources.length > 0 && (
                <p className="text-xs text-muted-foreground">Sources: {t.sources.join(", ")}</p>
              )}
              {t.officerNote && (
                <p className="rounded-md border border-safe/30 bg-safe-soft px-3 py-2 text-sm">
                  Officer decision: {t.officerNote}
                </p>
              )}

              {isOfficer && (
                <div className="grid gap-2 border-t pt-3 sm:grid-cols-[200px_1fr_auto]">
                  <Select
                    value={t.status}
                    onValueChange={(v) => {
                      updateTicket(t.id, { status: v as ReviewTicket["status"] });
                      toast.success(`${t.id} set to ${v}`);
                    }}
                  >
                    <SelectTrigger aria-label={`Status for ${t.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    rows={1}
                    placeholder="Officer decision / note"
                    aria-label={`Officer note for ${t.id}`}
                    value={note[t.id] ?? ""}
                    onChange={(e) => setNote((n) => ({ ...n, [t.id]: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateTicket(t.id, {
                        officerNote: note[t.id] ?? "",
                        status: "Resolved",
                      });
                      toast.success(`${t.id} resolved`);
                    }}
                  >
                    Record decision
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
