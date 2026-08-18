import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Lock, Search } from "lucide-react";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { POLICIES } from "@/lib/setu/data";
import { canAccessDoc } from "@/lib/setu/security";
import { versionAt } from "@/lib/setu/rag";
import { CATEGORY_KEYS, CLASSIFICATION_KEYS, DEPARTMENT_KEYS } from "@/lib/setu/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/setu/badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Base — TalkHub" },
      {
        name: "description",
        content:
          "Browse the authorised government policy knowledge base with classification, versions, effective dates and circular references.",
      },
      { property: "og:title", content: "Knowledge Base — TalkHub" },
      {
        property: "og:description",
        content: "Authorised, versioned government policy documents with full citations.",
      },
    ],
  }),
  component: KnowledgePage,
});

const CATEGORIES = [
  "All",
  "Leave",
  "Attendance",
  "Payroll",
  "LTC",
  "Transfers",
  "Recruitment",
  "Benefits",
  "Employee Welfare",
  "Department Policies",
  "Government Schemes",
  "Security",
];

function KnowledgePage() {
  const { passport, t, locale } = useSetu();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [asOf, setAsOf] = useState("");

  const list = useMemo(() => {
    const query = q.toLowerCase();
    return POLICIES.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (!query ||
          p.title.toLowerCase().includes(query) ||
          p.circular.toLowerCase().includes(query) ||
          p.keywords.some((k) => k.includes(query))),
    );
  }, [q, cat]);

  if (!passport) return null;
  const doc = POLICIES.find((p) => p.id === openId);
  const shown = doc ? versionAt(doc, asOf || null) : null;
  const docClassKey = doc ? CLASSIFICATION_KEYS[doc.classification] : undefined;

  const catLabel = (c: string) => {
    const key = CATEGORY_KEYS[c];
    return key ? t(key) : c;
  };
  const deptLabel = (d: string) => {
    const key = DEPARTMENT_KEYS[d];
    return key ? t(key) : d;
  };
  const classLabel = (c: string) => {
    const key = CLASSIFICATION_KEYS[c];
    return key ? t(key) : c;
  };

  return (
    <AppShell title={t("kb.title")} description={t("kb.description")}>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="space-y-1.5">
          <Label htmlFor="search">{t("kb.searchLabel")}</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="search"
              className="pl-9"
              placeholder={t("kb.searchPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat">{t("kb.categoryLabel")}</Label>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger id="cat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {catLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {list.length === 0 && (
        <p className="mt-8 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("kb.noResults")}
        </p>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
          const allowed = canAccessDoc(p, passport);
          const current = versionAt(p, null);
          return (
            <Card key={p.id} className={allowed ? "" : "opacity-80"}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-2 font-medium">
                    {allowed ? (
                      <FileText className="size-4 text-primary" aria-hidden />
                    ) : (
                      <Lock className="size-4 text-critical" aria-hidden />
                    )}
                    {p.title}
                  </p>
                  <StatusPill tone={allowed ? "safe" : "critical"}>
                    {allowed ? t("kb.authorised") : t("kb.restricted")}
                  </StatusPill>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.id} · {deptLabel(p.department)} · {catLabel(p.category)} ·{" "}
                  {classLabel(p.classification)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.circular} §{p.section} · {t("kb.version", { v: current.version })} ·{" "}
                  {t("common.effective")}{" "}
                  {new Date(current.effectiveFrom).toLocaleDateString(locale)}
                </p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{current.summary}</p>
                <Button
                  size="sm"
                  variant={allowed ? "outline" : "ghost"}
                  disabled={!allowed}
                  onClick={() => setOpenId(p.id)}
                >
                  {allowed ? t("kb.openDocument") : t("kb.accessDenied")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(doc)} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{doc?.title}</DialogTitle>
            <DialogDescription>
              {doc?.circular} · {t("kb.section")} {doc?.section} ·{" "}
              {docClassKey ? t(docClassKey) : doc?.classification} ·{" "}
              {t("kb.accessLevel", { n: doc?.minClearance ?? 1 })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="asof">{t("kb.timeMachine")}</Label>
            <Input id="asof" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </div>

          {shown && (
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{t("kb.version", { v: shown.version })}</p>
                <StatusPill tone={shown.status === "Current" ? "safe" : "neutral"}>
                  {shown.status === "Current"
                    ? t("pol.vstatus.current")
                    : t("pol.vstatus.superseded")}
                </StatusPill>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("common.effective")} {new Date(shown.effectiveFrom).toLocaleDateString(locale)} —{" "}
                {shown.effectiveTo
                  ? new Date(shown.effectiveTo).toLocaleDateString(locale)
                  : t("common.present")}
              </p>
              <p className="mt-2 text-sm">{shown.content}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{doc?.source}</p>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
