import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Inline spinner (Campa purple). Use for in-button or small inline loading. */
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin text-primary", className)}
      aria-hidden
    />
  );
}

/**
 * Loading state — skeleton rows while server data is in flight. Prefer this over a
 * bare spinner for lists/tables so the layout doesn't jump when data arrives.
 * `aria-live="polite"` so screen readers announce the load.
 */
export function LoadingState({
  label = "Loading…",
  rows = 3,
  className,
}: {
  label?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-lg border border-border p-4", className)}
      role="status"
      aria-live="polite"
    >
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        {label}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
