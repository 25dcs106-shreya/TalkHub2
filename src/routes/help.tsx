import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, HelpCircle, Languages, Mic, ShieldCheck, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help / About — TalkHub" },
      {
        name: "description",
        content:
          "What TalkHub is, how the zero-trust gateway protects every question, and how to use voice input and languages.",
      },
      { property: "og:title", content: "Help / About — TalkHub" },
      {
        property: "og:description",
        content: "How TalkHub protects government knowledge with a zero-trust AI gateway.",
      },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { t } = useSetu();

  const sections = [
    { icon: BookOpen, titleKey: "help.aboutTitle", bodyKeys: ["help.aboutBody"] },
    {
      icon: ShieldCheck,
      titleKey: "help.howTitle",
      bodyKeys: ["help.how1", "help.how2", "help.how3", "help.how4", "help.how5"],
    },
    { icon: Mic, titleKey: "help.voiceTitle", bodyKeys: ["help.voiceBody"] },
    { icon: Languages, titleKey: "help.langTitle", bodyKeys: ["help.langBody"] },
    { icon: ShieldCheck, titleKey: "help.securityTitle", bodyKeys: ["help.securityBody"] },
    { icon: LifeBuoy, titleKey: "help.supportTitle", bodyKeys: ["help.supportBody"] },
  ] as const;

  return (
    <AppShell title={t("help.title")} description={t("help.description")}>
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.titleKey}>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <s.icon className="size-4 text-primary" aria-hidden /> {t(s.titleKey)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {s.bodyKeys.map((k) => (
                <p key={k}>{t(k)}</p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <HelpCircle className="size-4" aria-hidden /> {t("app.demoFooter")}
      </p>
    </AppShell>
  );
}
