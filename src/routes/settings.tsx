import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/setu/AppShell";
import { useSetu, type Language } from "@/lib/setu/store";
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
      { title: "Settings — SetuAI 2.0" },
      {
        name: "description",
        content:
          "Configure SetuAI language, confidence threshold for human verification and review session security preferences.",
      },
      { property: "og:title", content: "Settings — SetuAI 2.0" },
      {
        property: "og:description",
        content: "Language, confidence threshold and session security preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { language, setLanguage, confidenceThreshold, setThreshold, clearChat, user } = useSetu();
  if (!user) return null;

  return (
    <AppShell title="Settings" description="Preferences apply to this demo session only.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Language</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="lang">Interface and assistant language</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger id="lang" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Questions may be asked in any supported language. The authoritative policy source
              remains the same regardless of language.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Confidence threshold</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="threshold">
              Require human verification below {confidenceThreshold}%
            </Label>
            <Slider
              id="threshold"
              min={40}
              max={95}
              step={5}
              value={[confidenceThreshold]}
              onValueChange={([v]) => setThreshold(v ?? 70)}
            />
            <p className="text-sm text-muted-foreground">
              Answers below this confidence are flagged and offered for human review.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Passwords, OTPs, API keys and private keys are never stored or logged.</p>
            <p>• Security logs contain metadata and reasons, never secret values.</p>
            <p>• Data minimisation: only the redacted query and authorised context reach the model.</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => {
                clearChat();
                toast.success("Conversation cleared from this device");
              }}
            >
              Clear conversation history
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
