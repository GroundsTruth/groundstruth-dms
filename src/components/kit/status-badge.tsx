import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "ok" | "warn" | "bad" | "neutral";

const TONES: Record<StatusTone, { wrap: string; dot: string }> = {
  ok: {
    wrap: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  warn: {
    wrap: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  bad: {
    wrap: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
  neutral: {
    wrap: "bg-muted text-muted-foreground ring-border",
    dot: "bg-muted-foreground/50",
  },
};

/**
 * Status pill. Colour is ALWAYS paired with a word — never colour alone
 * (AGENTS.md UI rule). Use for stock/availability/variance states.
 */
export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        t.wrap,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
      {children}
    </span>
  );
}
