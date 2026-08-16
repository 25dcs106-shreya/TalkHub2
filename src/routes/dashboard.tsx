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
import { POLICIES, ROLE_LABELS } from "@/lib/setu/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, riskTone } from "@/components/setu/badges";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Employee Dashboard — SetuAI 2.0" },
      {
        name: "description",
        content:
          "Your SetuAI workspace: session security status, quick access to the assistant, policy search, review tickets and recent activity.",
      },
      { property: "og:title", content: "Employee Dashboard — SetuAI 2.0" },
      {
        property: "og:description",
        content: "Session security status, quick actions and recent policy activity in SetuAI 2.0.",
      },
    ],
  }),
  component: DashboardPage,
});

const QUICK = [
  { to: "/assistant", label: "Ask SetuAI", icon: MessageSquareText, desc: "Source-backed policy answers" },
  { to: "/knowledge", label: "Search Policies", icon: Search, desc: "Authorised knowledge base" },
  { to: "/reviews", label: "My Requests", icon: ClipboardList, desc: "Human review tickets" },
  { to: "/passport", label: "My Security Passport", icon: ShieldCheck, desc: "What you may access" },
  { to: "/knowledge", label: "My Documents", icon: FileText, desc: "Policies in your scope" },
  { to: "/reviews", label: "Request Human Review", icon: LifeBuoy, desc: "Escalate to an officer" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function DashboardPage() {
  const { user, sessionRisk, messages, tickets, events } = useSetu();
  if (!user) return null;

  const myTickets = tickets.filter((t) => t.employeeId === user.employeeId);
  const recentQuestions = messages.filter((m) => m.role === "user").slice(-4).reverse();
  const recentUpdates = [...POLICIES]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 4);

  return (
    <AppShell
      title={`${greeting()}, ${user.name}`}
      description={`${user.department} Department · ${ROLE_LABELS[user.role]} · Clearance Level ${user.clearance}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Security status</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
              <span className={sessionRisk === "LOW" ? "text-safe" : "text-high"}>●</span>
              Session {sessionRisk === "LOW" ? "secure" : sessionRisk.toLowerCase()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Device {user.deviceTrust} · Zero-trust gateway active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Questions this session</p>
            <p className="mt-2 text-2xl font-bold">{messages.filter((m) => m.role === "user").length}</p>
            <p className="mt-1 text-xs text-muted-foreground">All routed through the gateway</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">My review tickets</p>
            <p className="mt-2 text-2xl font-bold">{myTickets.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {myTickets.filter((t) => t.status !== "Resolved").length} open
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Security events</p>
            <p className="mt-2 text-2xl font-bold">{events.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Metadata only — never secrets</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Quick actions</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK.map((q) => (
          <Link
            key={q.label}
            to={q.to}
            className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <q.icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-medium">{q.label}</span>
              <span className="block text-sm text-muted-foreground">{q.desc}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No questions yet this session. Start with “What is the procedure for casual leave?”
              </p>
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
            <CardTitle className="text-base">Recent tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myTickets.length === 0 && (
              <p className="text-sm text-muted-foreground">No human review requests raised.</p>
            )}
            {myTickets.slice(0, 4).map((t) => (
              <div key={t.id} className="rounded-md border px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{t.id}</span>
                  <StatusPill tone={riskTone(t.riskLevel)}>{t.status}</StatusPill>
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">{t.question}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent policy updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentUpdates.map((p) => (
              <div key={p.id} className="rounded-md border px-3 py-2 text-sm">
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.circular} · updated {new Date(p.lastUpdated).toLocaleDateString("en-IN")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
