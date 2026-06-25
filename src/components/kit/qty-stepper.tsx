"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Driver-friendly quantity control — large tap targets (48px), no keyboard.
 * Used wherever field staff set case counts (van load, order punch).
 */
export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border bg-card",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="grid h-12 w-12 place-items-center rounded-l-xl text-foreground transition active:bg-muted disabled:opacity-30"
      >
        <Minus className="h-5 w-5" />
      </button>
      <div className="w-14 text-center text-lg font-semibold tabular-nums">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="grid h-12 w-12 place-items-center rounded-r-xl bg-primary text-primary-foreground transition active:opacity-90 disabled:opacity-40"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
