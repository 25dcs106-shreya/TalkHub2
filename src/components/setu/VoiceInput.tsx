import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition, type SpeechErrorKind } from "@/hooks/useSpeechRecognition";
import { speechLocale, t, type Language } from "@/lib/setu/i18n";
import { cn } from "@/lib/utils";

/**
 * Microphone control. Speech is converted to text in the browser and inserted
 * into the normal chat input — it is never auto-sent, never stored as audio and
 * never sent to a model. The resulting text goes through the full SetuAI
 * security pipeline exactly like typed input.
 */
export function VoiceInput({
  language,
  disabled,
  onTranscript,
  onListeningChange,
}: {
  language: Language;
  disabled?: boolean;
  onTranscript: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
}) {
  const s = t(language);

  const { listening, supported, start, stop } = useSpeechRecognition({
    lang: speechLocale(language),
    onTranscript,
    onError: (kind: SpeechErrorKind) => {
      const message =
        kind === "unsupported"
          ? s.micUnsupported
          : kind === "denied"
            ? s.micDenied
            : kind === "no-speech"
              ? s.micNoSpeech
              : kind === "network"
                ? s.micNetwork
                : s.micError;
      toast.error(message);
    },
  });

  const label = listening ? s.micStop : s.micStart;

  return (
    <Button
          type="button"
          title={label}
          variant={listening ? "destructive" : "outline"}
          size="icon"
          aria-label={label}
          aria-pressed={listening}
          disabled={disabled}
          className={cn("size-11 shrink-0", listening && "animate-pulse")}
          onClick={() => {
            if (!supported) {
              toast.error(s.micUnsupported);
              return;
            }
            if (listening) {
              stop();
              onListeningChange?.(false);
            } else {
              start();
              onListeningChange?.(true);
            }
          }}
        >
          {listening ? <Square className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
    </Button>
  );
}
