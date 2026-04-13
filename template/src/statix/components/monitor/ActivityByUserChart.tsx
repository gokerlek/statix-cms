"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/statix/components/ui/chart";
import { EmptyState } from "@/statix/components/shared/EmptyState";
import ui from "@/statix/content/ui.json";
import { ActivityByUser } from "@/statix/lib/monitor-data";

interface ActivityByUserChartProps {
  data: ActivityByUser[];
}

const chartConfig: ChartConfig = {
  count: {
    label: ui.monitor.actionsLabel,
    color: "var(--primary)",
  },
};

export function ActivityByUserChart({ data }: ActivityByUserChartProps) {
  if (data.length === 0) {
    return <EmptyState message={ui.monitor.empty} />;
  }

  const chartData = data.map((d) => ({
    ...d,
    label: d.userName ?? d.userEmail.split("@")[0],
  }));

  return (
    <ChartContainer config={chartConfig} className="h-52 w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          width={100}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          cursor={{ fill: "var(--muted)" }}
        />
        <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
