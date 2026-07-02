"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const config = {
  sales: { label: "Sales", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export function RouteSalesChart({
  data,
}: {
  data: { route: string; sales: number }[];
}) {
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="route"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v: string) => v.replace("Route ", "R")}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        {/* maxBarSize keeps 1–2 routes with data from rendering as full-width slabs */}
        <Bar dataKey="sales" fill="var(--color-sales)" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ChartContainer>
  );
}
