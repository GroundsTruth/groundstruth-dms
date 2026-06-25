import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Executive KPI tile — one big, glanceable number per card. */
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  icon?: LucideIcon;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        {/* Label + icon share the top row; the icon never competes with the number. */}
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {label}
          </p>
          {Icon ? (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
        </div>
        {/* Value gets its own full-width line; scales down on small screens. */}
        <p
          className={cn(
            "mt-2 text-xl font-bold tracking-tight tabular-nums sm:text-2xl lg:text-3xl",
            accent && "text-primary",
          )}
        >
          {value}
        </p>
        {sub ? (
          <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
