"use client";

import { IconGlobe } from "@tabler/icons-react";

import { Progress } from "@/components/ui/progress";
import ui from "@/content/ui.json";

import { CMSCard } from "./shared/CMSCard";

interface CollectionStat {
  slug: string;
  label: string;
  totalEntries: number;
  translatedEntries: number;
  percentage: number;
}

interface LocaleStat {
  locale: string;
  totalEntries: number;
  translatedEntries: number;
  percentage: number;
  collections: CollectionStat[];
}

interface LocalizationStatsProps {
  stats: LocaleStat[];
}

export function LocalizationStats({ stats }: LocalizationStatsProps) {
  return (
    <CMSCard
      icon={<IconGlobe className="w-5 h-5" />}
      title={ui.dashboard.localization.title}
    >
      <div className="space-y-8">
        {stats.map((stat) => (
          <div key={stat.locale} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold">
                <div className="uppercase flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                    {stat.locale}
                  </span>

                  <span>{ui.dashboard.localization.total}</span>
                </div>

                <div className="text-muted-foreground">
                  {stat.translatedEntries} / {stat.totalEntries} (
                  {stat.percentage}%)
                </div>
              </div>

              <Progress value={stat.percentage} className="h-2" />
            </div>

            <div className="pl-4 space-y-3 border-l-2 border-muted ml-1">
              {stat.collections.map((collection) => (
                <div key={collection.slug} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {collection.label}
                    </span>

                    <span
                      className={
                        collection.percentage === 100
                          ? "text-green-600 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {collection.translatedEntries}/{collection.totalEntries}{" "}
                      ({collection.percentage}%)
                    </span>
                  </div>

                  <Progress
                    value={collection.percentage}
                    className="h-1.5 opacity-70"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CMSCard>
  );
}
