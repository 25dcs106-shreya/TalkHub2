import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition, type SpeechErrorKind } from "@/hooks/useSpeechRecognition";
import { speechLocale, translate, type Language } from "@/lib/setu/i18n";
import { cn } from "@/lib/utils";

/**
 * Microphone control. Speech is converted to text in the browser and inserted
 * into the normal chat input — it is never auto-sent, never stored as audio and
 * never sent to a model. The resulting text goes through the full TalkHub
 * security pipeline exactly like typed input.
 *
 * While listening, partial text streams into the input via `onInterim` and
 * committed utterances via `onFinal`; the user reviews, edits and presses Send.
 */
export function VoiceInput({
  language,
  disabled,
  onFinal,
  onInterim,
  onListeningChange,
}: {
  language: Language;
  disabled?: boolean;
  onFinal: (text: string) => void;
  onInterim?: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
}) {
  const tt = (key: Parameters<typeof translate>[1]) => translate(language, key);

  const { listening, supported, start, stop } = useSpeechRecognition({
    lang: speechLocale(language),
    onFinal,
    onInterim,
    onListeningChange,
    onError: (kind: SpeechErrorKind) => {
      const message =
        kind === "unsupported"
          ? tt("chat.micUnsupported")
          : kind === "denied"
            ? tt("chat.micDenied")
            : kind === "no-speech"
              ? tt("chat.micNoSpeech")
              : kind === "network"
                ? tt("chat.micNetwork")
                : tt("chat.micError");
      toast.error(message, {
        action:
          kind === "denied" || kind === "network" || kind === "no-speech"
            ? { label: tt("chat.tryAgain"), onClick: () => start() }
            : undefined,
      });
    },
  });

  const label = listening ? tt("chat.micStop") : tt("chat.micStart");

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
          toast.error(tt("chat.micUnsupported"));
          return;
        }
        if (listening) {
          stop();
        } else {
          start();
        }
      }}
    >
      {listening ? <Square className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
    </Button>
  );
}
