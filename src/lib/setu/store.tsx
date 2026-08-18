import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildPassport } from "./pipeline";
import { DEMO_USERS, SEED_EVENTS, SEED_TICKETS, findUser } from "./data";
import {
  localeTag,
  speechLocale,
  translate,
  type Language,
  type StringKey,
  type TranslateVars,
} from "./i18n";
import type {
  ChatMessage,
  DemoUser,
  GatewayResult,
  Passport,
  ReviewTicket,
  RiskLevel,
  SecurityEvent,
} from "./types";

export type { Language };

interface SetuState {
  user: DemoUser | null;
  passport: Passport | null;
  sessionRisk: RiskLevel;
  language: Language;
  messages: ChatMessage[];
  events: SecurityEvent[];
  tickets: ReviewTicket[];
  confidenceThreshold: number;
  notifications: { id: string; text: string; at: string; read: boolean }[];
}

const STORAGE_KEY = "talkhub.state.v1";

const initialState: SetuState = {
  user: null,
  passport: null,
  sessionRisk: "LOW",
  language: "en",
  messages: [],
  events: SEED_EVENTS,
  tickets: SEED_TICKETS,
  confidenceThreshold: 70,
  notifications: [
    {
      id: "N1",
      text: "Leave Policy v3.0 published — Casual Leave now 10 days.",
      at: "2026-08-16T05:00:00.000Z",
      read: false,
    },
    {
      id: "N2",
      text: "Policy conflict pending administrator verification.",
      at: "2026-08-15T13:45:00.000Z",
      read: false,
    },
  ],
};

export interface LoginResult {
  ok: boolean;
  errorKey?: StringKey;
  errorDept?: string;
}

interface SetuContextValue extends SetuState {
  hydrated: boolean;
  /** Translate a UI key into the currently selected language. */
  t: (key: StringKey, vars?: TranslateVars) => string;
  /** BCP-47 tag for the selected language (date/number formatting). */
  locale: string;
  login: (identifier: string, password: string, department: string) => LoginResult;
  loginAs: (username: string) => void;
  logout: () => void;
  setLanguage: (l: Language) => void;
  setThreshold: (n: number) => void;
  addMessage: (m: ChatMessage) => void;
  replaceMessage: (id: string, m: ChatMessage) => void;
  clearChat: () => void;
  logEvent: (e: Omit<SecurityEvent, "id" | "timestamp">) => void;
  raiseSessionRisk: (level: RiskLevel, reason: string) => void;
  createTicket: (t: Omit<ReviewTicket, "id" | "createdAt" | "status">) => ReviewTicket;
  updateTicket: (id: string, patch: Partial<ReviewTicket>) => void;
  markNotificationsRead: () => void;
  recordResult: (question: string, result: GatewayResult) => void;
}

const SetuContext = createContext<SetuContextValue | null>(null);

const RISK_ORDER: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function SetuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SetuState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      // Migrate from the previous storage key so the language/session survives.
      const raw =
        localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("setuai.state.v1");
      if (raw) {
        const parsed = JSON.parse(raw) as SetuState;
        setState({ ...initialState, ...parsed });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [state, hydrated]);

  // Keep <html lang> and the document language in sync with the selection.
  useEffect(() => {
    document.documentElement.lang = speechLocale(state.language);
  }, [state.language]);

  const logEvent = useCallback((e: Omit<SecurityEvent, "id" | "timestamp">) => {
    setState((s) => ({
      ...s,
      events: [
        {
          ...e,
          id: `SEV-${Math.floor(Math.random() * 9000 + 1000)}`,
          timestamp: new Date().toISOString(),
        },
        ...s.events,
      ].slice(0, 200),
    }));
  }, []);

  const value = useMemo<SetuContextValue>(() => {
    const login = (identifier: string, password: string, department: string): LoginResult => {
      const user = findUser(identifier);
      if (!user) return { ok: false, errorKey: "login.errorUnknown" };
      if (user.password !== password) return { ok: false, errorKey: "login.errorPassword" };
      if (department && department !== user.department)
        return { ok: false, errorKey: "login.errorDepartment", errorDept: user.department };
      setState((s) => ({
        ...s,
        user,
        passport: buildPassport(user, "LOW"),
        sessionRisk: "LOW",
        messages: [],
      }));
      return { ok: true };
    };

    return {
      ...state,
      hydrated,
      t: (key, vars) => translate(state.language, key, vars),
      locale: localeTag(state.language),
      login,
      loginAs: (username: string) => {
        const user = DEMO_USERS.find((u) => u.username === username);
        if (!user) return;
        setState((s) => ({
          ...s,
          user,
          passport: buildPassport(user, "LOW"),
          sessionRisk: "LOW",
          messages: [],
        }));
      },
      logout: () =>
        setState((s) => ({ ...s, user: null, passport: null, messages: [], sessionRisk: "LOW" })),
      setLanguage: (language: Language) => setState((s) => ({ ...s, language })),
      setThreshold: (confidenceThreshold: number) =>
        setState((s) => ({ ...s, confidenceThreshold })),
      addMessage: (m) => setState((s) => ({ ...s, messages: [...s.messages, m] })),
      replaceMessage: (id, m) =>
        setState((s) => ({ ...s, messages: s.messages.map((x) => (x.id === id ? m : x)) })),
      clearChat: () => setState((s) => ({ ...s, messages: [] })),
      logEvent,
      raiseSessionRisk: (level, reason) =>
        setState((s) => {
          if (RISK_ORDER.indexOf(level) <= RISK_ORDER.indexOf(s.sessionRisk)) return s;
          return {
            ...s,
            sessionRisk: level,
            passport: s.passport ? { ...s.passport, sessionRisk: level } : s.passport,
            notifications: [
              {
                id: `N-${Date.now()}`,
                text: `Session risk raised to ${level}: ${reason}`,
                at: new Date().toISOString(),
                read: false,
              },
              ...s.notifications,
            ],
          };
        }),
      createTicket: (t) => {
        const ticket: ReviewTicket = {
          ...t,
          id: `REV-${Math.floor(Math.random() * 9000 + 1000)}`,
          createdAt: new Date().toISOString(),
          status: "Pending",
        };
        setState((s) => ({ ...s, tickets: [ticket, ...s.tickets] }));
        return ticket;
      },
      updateTicket: (id, patch) =>
        setState((s) => ({
          ...s,
          tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      markNotificationsRead: () =>
        setState((s) => ({
          ...s,
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      recordResult: (question, result) => {
        const user = state.user;
        if (!user) return;
        const action =
          result.credentials.length > 0
            ? "Credential Detection"
            : result.injection
              ? "Prompt Injection Attempt"
              : result.outcome === "denied"
                ? "RBAC Authorisation"
                : result.redactions.length
                  ? "PII Redaction"
                  : "Knowledge Retrieval";
        const res =
          result.outcome === "blocked"
            ? "BLOCKED"
            : result.outcome === "denied"
              ? "DENIED"
              : result.redactions.length
                ? "REDACTED"
                : "ALLOWED";
        logEvent({
          userId: user.employeeId,
          department: user.department,
          action,
          // Employees never receive risk internals; derive a coarse level for
          // the local metadata log without exposing scores or factors.
          riskLevel:
            result.risk?.level ??
            (result.securityStatus === "blocked"
              ? "HIGH"
              : result.securityStatus === "protected"
                ? "MEDIUM"
                : "LOW"),
          result: res,
          reason: result.risk?.reasons[0] ?? "Query processed by gateway",
        });
      },
    };
  }, [state, hydrated, logEvent]);

  return <SetuContext.Provider value={value}>{children}</SetuContext.Provider>;
}

export function useSetu() {
  const ctx = useContext(SetuContext);
  if (!ctx) throw new Error("useSetu must be used inside SetuProvider");
  return ctx;
}
