import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/setu/types";
import { ShieldCheck, ShieldAlert, ShieldX, TriangleAlert } from "lucide-react";

const RISK_STYLE: Record<RiskLevel, { cls: string; label: string }> = {
  LOW: { cls: "bg-safe-soft text-safe border-safe/30", label: "LOW" },
  MEDIUM: { cls: "bg-warn-soft text-warn-foreground border-warn/40", label: "MEDIUM" },
  HIGH: { cls: "bg-high-soft text-high border-high/40", label: "HIGH" },
  CRITICAL: { cls: "bg-critical-soft text-critical border-critical/40", label: "CRITICAL" },
};

export function RiskBadge({
  level,
  score,
  className,
}: {
  level: RiskLevel;
  score?: number;
  className?: string;
}) {
  const s = RISK_STYLE[level];
  const Icon =
    level === "LOW" ? ShieldCheck : level === "MEDIUM" ? ShieldAlert : level === "HIGH" ? TriangleAlert : ShieldX;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        s.cls,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      <span>
        RISK {s.label}
        {typeof score === "number" ? ` · ${score}/100` : ""}
      </span>
    </span>
  );
}

export function ConfidenceBadge({ value }: { value: number }) {
  const tone =
    value >= 85 ? "bg-safe-soft text-safe border-safe/30" : value >= 70 ? "bg-warn-soft text-warn-foreground border-warn/40" : "bg-high-soft text-high border-high/40";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", tone)}>
      Confidence {value}%
    </span>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "safe" | "warn" | "high" | "critical";
  children: React.ReactNode;
}) {
  const map = {
    neutral: "bg-secondary text-secondary-foreground border-border",
    safe: "bg-safe-soft text-safe border-safe/30",
    warn: "bg-warn-soft text-warn-foreground border-warn/40",
    high: "bg-high-soft text-high border-high/40",
    critical: "bg-critical-soft text-critical border-critical/40",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", map[tone])}>
      {children}
    </span>
  );
}

export function riskTone(level: RiskLevel) {
  return level === "LOW" ? "safe" : level === "MEDIUM" ? "warn" : level === "HIGH" ? "high" : "critical";
}
