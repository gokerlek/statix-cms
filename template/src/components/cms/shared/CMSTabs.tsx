"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabItem {
  value: string;
  label: string;
  count?: number;
}

interface CMSTabsProps {
  defaultValue?: string;
  value: string;
  onValueChange: (value: string) => void;
  tabs: TabItem[];
  className?: string;
}

export function CMSTabs({
  defaultValue,
  value,
  onValueChange,
  tabs,
  className,
}: CMSTabsProps) {
  return (
    <Tabs
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.label}

            {tab.count !== undefined && (
              <Badge variant="secondary" className="ml-1 px-1 py-0 h-5 text-xs">
                {tab.count}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
