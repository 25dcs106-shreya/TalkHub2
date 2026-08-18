import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, FilePlus2, GitBranch } from "lucide-react";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { POLICIES } from "@/lib/setu/data";
import type { Classification, PolicyDoc } from "@/lib/setu/types";
import { CATEGORY_KEYS, CLASSIFICATION_KEYS, DEPARTMENT_KEYS } from "@/lib/setu/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/setu/badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { detectInjection } from "@/lib/setu/security";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Policy Management — TalkHub" },
      {
        name: "description",
        content:
          "Administrator tools to upload, version, reclassify and archive government policy documents feeding the secure knowledge base.",
      },
      { property: "og:title", content: "Policy Management — TalkHub" },
      {
        property: "og:description",
        content: "Upload, version and classify policies with prompt-injection screening on ingest.",
      },
    ],
  }),
  component: PoliciesPage,
});

const CLASSES: Classification[] = ["Public", "Internal", "Restricted", "Confidential"];

const UPLOAD_CATEGORIES = [
  "Leave",
  "Attendance",
  "Payroll",
  "LTC",
  "Transfers",
  "Recruitment",
  "Benefits",
  "Employee Welfare",
  "Department Policies",
  "Security",
];

function PoliciesPage() {
  const { user, logEvent, t, locale } = useSetu();
  const [docs, setDocs] = useState<PolicyDoc[]>(POLICIES);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Leave");
  const [classification, setClassification] = useState<Classification>("Internal");
  const [effective, setEffective] = useState("");
  const [content, setContent] = useState("");

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <AppShell title={t("pol.title")}>
        <p className="rounded-lg border border-critical/40 bg-critical-soft p-6 text-sm text-critical">
          {t("pol.accessDenied")}
        </p>
      </AppShell>
    );
  }

  const catLabel = (c: string) => {
    const key = CATEGORY_KEYS[c];
    return key ? t(key) : c;
  };
  const classLabel = (c: string) => {
    const key = CLASSIFICATION_KEYS[c];
    return key ? t(key) : c;
  };
  const deptLabel = (d: string) => {
    const key = DEPARTMENT_KEYS[d];
    return key ? t(key) : d;
  };

  function upload() {
    if (!title.trim() || !content.trim()) return;
    if (detectInjection(content)) {
      logEvent({
        userId: user!.employeeId,
        department: user!.department,
        action: "Prompt Injection in Document",
        riskLevel: "HIGH",
        result: "BLOCKED",
        reason: "Uploaded document contained instruction-override text — ingestion refused",
      });
      toast.error(t("pol.blockedToast"), {
        description: t("pol.blockedDesc"),
      });
      return;
    }
    const doc: PolicyDoc = {
      id: `DOC-NEW-${Math.floor(Math.random() * 900 + 100)}`,
      title: title.trim(),
      department: user!.department,
      category,
      classification,
      accessRoles:
        classification === "Confidential"
          ? ["security_officer", "admin"]
          : classification === "Restricted"
            ? ["hr_officer", "dept_officer", "admin"]
            : ["employee", "hr_officer", "dept_officer", "security_officer", "admin"],
      minClearance: classification === "Confidential" ? 4 : classification === "Restricted" ? 3 : 1,
      circular: `GOV/NEW/${new Date().getFullYear()}/${Math.floor(Math.random() * 900 + 100)}`,
      section: "1.0",
      lastUpdated: effective || new Date().toISOString().slice(0, 10),
      expiryDate: null,
      source: "Uploaded via TalkHub admin console (DEMO / FICTIONAL DATA)",
      keywords: title.toLowerCase().split(/\s+/),
      versions: [
        {
          version: "1.0",
          effectiveFrom: effective || new Date().toISOString().slice(0, 10),
          effectiveTo: null,
          status: "Current",
          summary: content.slice(0, 90),
          content: content.trim(),
        },
      ],
    };
    setDocs((d) => [doc, ...d]);
    setTitle("");
    setContent("");
    logEvent({
      userId: user!.employeeId,
      department: user!.department,
      action: "Policy Upload",
      riskLevel: "LOW",
      result: "ALLOWED",
      reason: `${doc.id} ingested with classification ${doc.classification}`,
    });
    toast.success(t("pol.uploaded", { id: doc.id }));
  }

  function newVersion(id: string) {
    setDocs((list) =>
      list.map((d) => {
        if (d.id !== id) return d;
        const next = (parseFloat(d.versions[0]!.version) + 1).toFixed(1);
        return {
          ...d,
          versions: [
            {
              version: next,
              effectiveFrom: new Date().toISOString().slice(0, 10),
              effectiveTo: null,
              status: "Current",
              summary: "New draft version created by administrator.",
              content: d.versions[0]!.content,
            },
            ...d.versions.map((v) =>
              v.status === "Current"
                ? {
                    ...v,
                    status: "Superseded" as const,
                    effectiveTo: new Date().toISOString().slice(0, 10),
                  }
                : v,
            ),
          ],
        };
      }),
    );
    toast.success(t("pol.versioned", { id }));
  }

  return (
    <AppShell title={t("pol.title")} description={t("pol.description")}>
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FilePlus2 className="size-4 text-primary" aria-hidden /> {t("pol.uploadTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ptitle">{t("pol.titleLabel")}</Label>
              <Input id="ptitle" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pcat">{t("pol.categoryLabel")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="pcat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UPLOAD_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {catLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pclass">{t("pol.classLabel")}</Label>
              <Select
                value={classification}
                onValueChange={(v) => setClassification(v as Classification)}
              >
                <SelectTrigger id="pclass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {classLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="peff">{t("pol.effectiveLabel")}</Label>
              <Input
                id="peff"
                type="date"
                value={effective}
                onChange={(e) => setEffective(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pbody">{t("pol.contentLabel")}</Label>
              <Textarea
                id="pbody"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={upload} disabled={!title.trim() || !content.trim()}>
              {t("pol.uploadButton")}
            </Button>
            <p className="text-xs text-muted-foreground">{t("pol.uploadHint")}</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.id} · {deptLabel(d.department)} · {catLabel(d.category)} · {d.circular}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill
                      tone={
                        d.classification === "Confidential"
                          ? "critical"
                          : d.classification === "Restricted"
                            ? "warn"
                            : "safe"
                      }
                    >
                      {classLabel(d.classification)}
                    </StatusPill>
                    <StatusPill>L{d.minClearance}+</StatusPill>
                  </div>
                </div>

                <div className="space-y-1">
                  {d.versions.map((v) => (
                    <p key={v.version} className="text-xs text-muted-foreground">
                      {t("common.version")} {v.version} ·{" "}
                      {v.status === "Current"
                        ? t("pol.vstatus.current")
                        : t("pol.vstatus.superseded")}{" "}
                      · {t("common.effective")}{" "}
                      {new Date(v.effectiveFrom).toLocaleDateString(locale)}
                      {v.effectiveTo
                        ? ` — ${new Date(v.effectiveTo).toLocaleDateString(locale)}`
                        : ` — ${t("common.present")}`}
                    </p>
                  ))}
                </div>

                {d.conflict && (
                  <p className="rounded-md border border-warn/40 bg-warn-soft px-3 py-2 text-sm">
                    ⚠️ {t("pol.conflictPending", { note: d.conflict.note })}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => newVersion(d.id)}>
                    <GitBranch className="mr-2 size-4" /> {t("pol.createVersion")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDocs((list) => list.filter((x) => x.id !== d.id));
                      toast.success(t("pol.archived", { id: d.id }));
                    }}
                  >
                    <Archive className="mr-2 size-4" /> {t("pol.archive")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
