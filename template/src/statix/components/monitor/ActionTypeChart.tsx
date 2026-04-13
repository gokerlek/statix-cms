"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/statix/components/ui/chart";
import { EmptyState } from "@/statix/components/shared/EmptyState";
import ui from "@/statix/content/ui.json";
import { ActionTypeCount } from "@/statix/lib/monitor-data";

interface ActionTypeChartProps {
  data: ActionTypeCount[];
}

export function ActionTypeChart({ data }: ActionTypeChartProps) {
  if (data.length === 0) {
    return <EmptyState message={ui.monitor.empty} />;
  }

  // Use slice-based keys so ChartContainer sets --color-slice0, --color-slice1, etc.
  // hsl(var(--chart-N)) doesn't resolve in SVG fill directly, but var(--color-sliceN) does.
  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((d, i) => [
      `slice${i}`,
      { label: d.action, color: `hsl(var(--chart-${(i % 5) + 1}))` },
    ]),
  );

  const chartData = data.map((d, i) => ({
    ...d,
    fill: `var(--color-slice${i})`,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-52 w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="action"
          innerRadius="60%"
          strokeWidth={3}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="action" />}
          className="flex-wrap gap-1 text-xs"
        />
      </PieChart>
    </ChartContainer>
  );
}
