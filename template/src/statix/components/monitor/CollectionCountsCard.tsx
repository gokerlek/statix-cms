"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

import { EmptyState } from "@/statix/components/shared/EmptyState";
import ui from "@/statix/content/ui.json";
import type { CollectionCount } from "@/statix/lib/monitor-data";

interface CollectionCountsCardProps {
  data: CollectionCount[];
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface TileProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  count?: number;
  index?: number;
}

// Custom tile renderer — label + count inside each tile
function CustomTile({ x = 0, y = 0, width = 0, height = 0, name = "", count = 0, index = 0 }: TileProps) {
  const color = CHART_COLORS[index % CHART_COLORS.length];
  const showLabel = width > 40 && height > 22;
  const showCount = height > 42;
  const fontSize = Math.max(9, Math.min(12, width / Math.max(name.length * 0.65, 1)));
  const label = name.length > 16 ? name.slice(0, 14) + "…" : name;

  return (
    <g>
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(0, width - 4)}
        height={Math.max(0, height - 4)}
        rx={6}
        ry={6}
        fill={color}
        opacity={0.88}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 + (showCount ? -9 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={fontSize}
          fontWeight={600}
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
      )}
      {showCount && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize={10}
          style={{ pointerEvents: "none" }}
        >
          {count}
        </text>
      )}
    </g>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; count: number } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, count } = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md">
      <span className="font-medium">{name}</span>
      <span className="ml-2 text-muted-foreground">
        {count} {ui.monitor.collectionCounts.tooltip.toLowerCase()}
      </span>
    </div>
  );
}

export function CollectionCountsCard({ data }: CollectionCountsCardProps) {
  if (data.length === 0) {
    return <EmptyState message={ui.monitor.collectionCounts.empty} />;
  }

  const treeData = data.map((d, i) => ({
    name: d.label,
    size: d.count,
    count: d.count,
    index: i,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <Treemap
        data={treeData}
        dataKey="size"
        stroke="transparent"
        content={<CustomTile />}
      >
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  );
}
