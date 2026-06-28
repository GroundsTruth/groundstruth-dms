import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ErrorVariant = "error" | "offline";

/**
 * Error / no-network state. `variant="offline"` swaps the icon + copy for the
 * connectivity case — important here because the app is server-rendered, so a
 * field rep on patchy mobile data needs a clear, retryable "can't reach server"
 * screen (not a blank page). Always offer a retry when `onRetry` is provided.
 * Red is reserved for genuine errors (Campa Red = alerts only); offline uses amber.
 */
export function ErrorState({
  variant = "error",
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: {
  variant?: ErrorVariant;
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  const offline = variant === "offline";
  const Icon = offline ? WifiOff : AlertTriangle;
  const heading = title ?? (offline ? "You're offline" : "Something went wrong");
  const body =
    description ??
    (offline
      ? "We couldn't reach the server. Check your connection — your data is safe; try again once you're back online."
      : "We hit an unexpected error. Please try again in a moment.");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          offline ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600",
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{heading}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
