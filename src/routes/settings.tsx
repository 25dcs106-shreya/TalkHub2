import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu } from "@/lib/setu/store";
import { LANGUAGE_OPTIONS, type Language } from "@/lib/setu/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TalkHub" },
      {
        name: "description",
        content:
          "Configure TalkHub language, confidence threshold for human verification and review session security preferences.",
      },
      { property: "og:title", content: "Settings — TalkHub" },
      {
        property: "og:description",
        content: "Language, confidence threshold and session security preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { language, setLanguage, confidenceThreshold, setThreshold, clearChat, user, t } =
    useSetu();
  if (!user) return null;

  return (
    <AppShell title={t("set.title")} description={t("set.description")}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("set.languageTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="lang">{t("set.languageLabel")}</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger id="lang" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{t("set.languageNote")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("set.thresholdTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="threshold">
              {t("set.thresholdLabel", { n: confidenceThreshold })}
            </Label>
            <Slider
              id="threshold"
              min={40}
              max={95}
              step={5}
              value={[confidenceThreshold]}
              onValueChange={([v]) => setThreshold(v ?? 70)}
            />
            <p className="text-sm text-muted-foreground">{t("set.thresholdNote")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{t("set.privacyTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• {t("set.privacy1")}</p>
            <p>• {t("set.privacy2")}</p>
            <p>• {t("set.privacy3")}</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => {
                clearChat();
                toast.success(t("set.clearedToast"));
              }}
            >
              {t("set.clearButton")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
