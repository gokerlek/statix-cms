"use client";

import * as React from "react";

import { Label, Pie, PieChart } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface DonutChartProps {
  data: Record<string, string | number>[];
  dataKey: string;
  nameKey: string;
  total: number;
  totalLabel?: string;
  config: ChartConfig;
  footerText?: React.ReactNode;
  footerSubtext?: string;
}

export function DonutChart({
  data,
  dataKey,
  nameKey,
  total,
  totalLabel = "Total",
  config,
  footerText,
  footerSubtext,
}: DonutChartProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square w-full h-full"
        >
          <PieChart margin={{ left: 0, right: 0 }}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              innerRadius={"70%"}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>

                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {totalLabel}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>

            <ChartLegend
              content={<ChartLegendContent nameKey={nameKey} />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </div>

      {(footerText || footerSubtext) && (
        <div className="flex flex-col gap-2 text-sm mt-4">
          {footerText && (
            <div className="flex items-center gap-2 leading-none font-medium">
              {footerText}
            </div>
          )}

          {footerSubtext && (
            <div className="text-muted-foreground leading-none">
              {footerSubtext}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
