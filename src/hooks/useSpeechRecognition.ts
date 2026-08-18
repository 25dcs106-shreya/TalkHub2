import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechErrorKind =
  | "unsupported"
  | "denied"
  | "no-speech"
  | "network"
  | "aborted"
  | "unavailable"
  | "unknown";

interface SpeechRecognitionResultItem {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultItem>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
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
 *
 * - `onInterim(text)` fires with live partial text while the user speaks.
 * - `onFinal(text)` fires with each committed utterance chunk.
 * - Recognition runs continuously until `stop()` so the user controls the
 *   recording with an explicit stop action.
 */
export function useSpeechRecognition(options: {
  lang: string;
  onFinal: (text: string) => void;
  onInterim?: ((text: string) => void) | undefined;
  onError?: ((kind: SpeechErrorKind) => void) | undefined;
  onListeningChange?: ((listening: boolean) => void) | undefined;
}) {
  const { lang, onFinal, onInterim, onError, onListeningChange } = options;
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cbRef = useRef({ onFinal, onInterim, onError, onListeningChange });
  cbRef.current = { onFinal, onInterim, onError, onListeningChange };

  const clearStartTimer = useCallback(() => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
  }, []);

  const setActive = useCallback((v: boolean) => {
    setListening(v);
    cbRef.current.onListeningChange?.(v);
  }, []);

  const stop = useCallback(() => {
    clearStartTimer();
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, [clearStartTimer]);

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
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let started = false;
    rec.onstart = () => {
      started = true;
      clearStartTimer();
      setActive(true);
    };
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex ?? 0; i < event.results.length; i += 1) {
        const res = event.results[i];
        if (!res) continue;
        const text = res[0]?.transcript ?? "";
        // Speech becomes text only. It is handed back to the input for the
        // user to review/edit — it is never auto-submitted from here.
        if (res.isFinal) {
          const trimmed = text.trim();
          if (trimmed) cbRef.current.onFinal(trimmed);
        } else {
          interim += text;
        }
      }
      cbRef.current.onInterim?.(interim);
    };
    rec.onerror = (event) => {
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
      setActive(false);
      cbRef.current.onInterim?.("");
      if (kind !== "aborted") cbRef.current.onError?.(kind);
    };
    rec.onend = () => {
      setActive(false);
      cbRef.current.onInterim?.("");
    };

    try {
      rec.start();
    } catch {
      setActive(false);
      cbRef.current.onError?.("unknown");
    }
  }, [lang, setActive]);

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

  return { listening, supported, start, stop, toggle: () => (listening ? stop() : start()) };
}
