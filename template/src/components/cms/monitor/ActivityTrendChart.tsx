"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/cms/shared/EmptyState";
import ui from "@/content/ui.json";
import { ActivityTrendPoint } from "@/lib/monitor-data";

interface ActivityTrendChartProps {
  data: ActivityTrendPoint[];
}

const chartConfig: ChartConfig = {
  count: {
    label: ui.monitor.actionsLabel,
    color: "var(--primary)",
  },
};

export function ActivityTrendChart({ data }: ActivityTrendChartProps) {
  if (data.length === 0) {
    return <EmptyState message={ui.monitor.empty} />;
  }

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--primary)"
          fill="url(#fillCount)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
