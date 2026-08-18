import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageSquareText,
  Search,
  ClipboardList,
  FileText,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { POLICIES } from "@/lib/setu/data";
import { canViewRiskDetails } from "@/lib/setu/authz";
import {
  DEPARTMENT_KEYS,
  RISK_KEYS,
  ROLE_KEYS,
  TICKET_STATUS_KEYS,
  type StringKey,
} from "@/lib/setu/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, riskTone } from "@/components/setu/badges";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Employee Dashboard — TalkHub" },
      {
        name: "description",
        content:
          "Your TalkHub workspace: session security status, quick access to the assistant, policy search, review tickets and recent activity.",
      },
      { property: "og:title", content: "Employee Dashboard — TalkHub" },
      {
        property: "og:description",
        content: "Session security status, quick actions and recent policy activity in TalkHub.",
      },
    ],
  }),
  component: DashboardPage,
});

const QUICK: { to: string; labelKey: StringKey; descKey: StringKey; icon: typeof Search }[] = [
  { to: "/assistant", labelKey: "dash.qaAssistant", descKey: "dash.qaAssistantDesc", icon: MessageSquareText },
  { to: "/knowledge", labelKey: "dash.qaKnowledge", descKey: "dash.qaKnowledgeDesc", icon: Search },
  { to: "/reviews", labelKey: "dash.qaReviews", descKey: "dash.qaReviewsDesc", icon: ClipboardList },
  { to: "/passport", labelKey: "dash.qaPassport", descKey: "dash.qaPassportDesc", icon: ShieldCheck },
  { to: "/knowledge", labelKey: "dash.qaDocs", descKey: "dash.qaDocsDesc", icon: FileText },
  { to: "/reviews", labelKey: "dash.qaReview", descKey: "dash.qaReviewDesc", icon: LifeBuoy },
];

function DashboardPage() {
  const { user, sessionRisk, messages, tickets, events, t, locale } = useSetu();
  if (!user) return null;

  const h = new Date().getHours();
  const greeting = h < 12 ? t("dash.morning") : h < 17 ? t("dash.afternoon") : t("dash.evening");
  const deptKey = DEPARTMENT_KEYS[user.department];
  const deptLabel = deptKey ? t(deptKey) : user.department;
  const canSeeRisk = canViewRiskDetails(user.role);

  const myTickets = tickets.filter((tk) => tk.employeeId === user.employeeId);
  const recentQuestions = messages.filter((m) => m.role === "user").slice(-4).reverse();
  const recentUpdates = [...POLICIES]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 4);

  return (
    <AppShell
      title={`${greeting}, ${user.name}`}
      description={`${deptLabel} ${t("dash.department")} · ${t(ROLE_KEYS[user.role])} · ${t("dash.clearanceLevel")} ${user.clearance}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("dash.securityStatus")}
            </p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
              <span className={sessionRisk === "LOW" ? "text-safe" : "text-high"}>●</span>
              {sessionRisk === "LOW"
                ? t("dash.sessionSecure")
                : canSeeRisk
                  ? t("dash.sessionRisk", { level: t(RISK_KEYS[sessionRisk] ?? "risk.low") })
                  : t("dash.sessionProtected")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dash.deviceGateway", { device: user.deviceTrust })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("dash.questionsSession")}
            </p>
            <p className="mt-2 text-2xl font-bold">
              {messages.filter((m) => m.role === "user").length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("dash.allViaGateway")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("dash.myTickets")}
            </p>
            <p className="mt-2 text-2xl font-bold">{myTickets.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dash.open", { n: myTickets.filter((tk) => tk.status !== "Resolved").length })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("dash.securityEvents")}
            </p>
            <p className="mt-2 text-2xl font-bold">{events.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("dash.metadataOnly")}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-8 text-lg font-semibold">{t("dash.quickActions")}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK.map((q) => (
          <Link
            key={q.labelKey}
            to={q.to}
            className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <q.icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-medium">{t(q.labelKey)}</span>
              <span className="block text-sm text-muted-foreground">{t(q.descKey)}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dash.recentQuestions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("dash.noQuestions")}</p>
            )}
            {recentQuestions.map((m) => (
              <p key={m.id} className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {m.text}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dash.recentTickets")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myTickets.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("dash.noTickets")}</p>
            )}
            {myTickets.slice(0, 4).map((tk) => (
              <div key={tk.id} className="rounded-md border px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{tk.id}</span>
                  <StatusPill tone={riskTone(tk.riskLevel)}>
                    {t(TICKET_STATUS_KEYS[tk.status] ?? "status.pending")}
                  </StatusPill>
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">{tk.question}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dash.recentUpdates")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentUpdates.map((p) => (
              <div key={p.id} className="rounded-md border px-3 py-2 text-sm">
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.circular} · {t("common.lastUpdated")}{" "}
                  {new Date(p.lastUpdated).toLocaleDateString(locale)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
