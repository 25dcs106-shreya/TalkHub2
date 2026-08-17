import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechErrorKind =
  | "unsupported"
  | "denied"
  | "no-speech"
  | "network"
  | "aborted"
  | "unknown";

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as
    | (new () => SpeechRecognitionLike)
    | null;
}

/**
 * Browser speech-to-text. Produces TEXT ONLY — no audio ever leaves the
 * browser through this hook, nothing is recorded or stored, and the caller
 * decides when (and whether) the transcript is submitted to the gateway.
 */
export function useSpeechRecognition(options: {
  lang: string;
  onTranscript: (text: string) => void;
  onError?: (kind: SpeechErrorKind) => void;
}) {
  const { lang, onTranscript, onError } = options;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const cbRef = useRef({ onTranscript, onError });
  cbRef.current = { onTranscript, onError };

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      cbRef.current.onError?.("unsupported");
      return;
    }
    try {
      recRef.current?.abort();
    } catch {
      /* no active session */
    }

    let rec: SpeechRecognitionLike;
    try {
      rec = new Ctor();
    } catch {
      cbRef.current.onError?.("unknown");
      return;
    }
    recRef.current = rec;
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => setListening(true);
    rec.onresult = (event: any) => {
      let finalText = "";
      let partial = "";
      for (let i = event.resultIndex ?? 0; i < event.results.length; i += 1) {
        const res = event.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += text;
        else partial += text;
      }
      setInterim(partial);
      // Speech becomes text only. It is handed back to the input for the user
      // to review/edit — it is never auto-submitted from here.
      if (finalText.trim()) cbRef.current.onTranscript(finalText.trim());
    };
    rec.onerror = (event: any) => {
      const code = String(event?.error ?? "unknown");
      const kind: SpeechErrorKind =
        code === "not-allowed" || code === "service-not-allowed"
          ? "denied"
          : code === "no-speech"
            ? "no-speech"
            : code === "network"
              ? "network"
              : code === "aborted"
                ? "aborted"
                : "unknown";
      setListening(false);
      setInterim("");
      if (kind !== "aborted") cbRef.current.onError?.(kind);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    try {
      rec.start();
    } catch {
      setListening(false);
      cbRef.current.onError?.("unknown");
    }
  }, [lang]);

  // Language changes mid-session: restart cleanly with the new locale.
  useEffect(() => {
    if (recRef.current) recRef.current.lang = lang;
  }, [lang]);

  useEffect(
    () => () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    },
    [],
  );

  return { listening, interim, supported, start, stop, toggle: () => (listening ? stop() : start()) };
}
