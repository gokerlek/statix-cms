"use client";

import { useState } from "react";

import ui from "@/content/ui.json";

import { Activity, ActivityItem } from "./ActivityItem";
import CMSPagination from "./shared/CMSPagination";
import { CMSSearch } from "./shared/CMSSearch";
import { CMSTabs } from "./shared/CMSTabs";

interface DetailedRecentActivityProps {
  activities: Activity[];
}

export function DetailedRecentActivity({
  activities,
}: DetailedRecentActivityProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    // Note: We don't filter out technical emails here to match the widget behavior
    // We only hide the email text in the render loop below

    const matchesSearch =
      activity.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.author.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;

    // We still need getActivityType for filtering logic, even if visualization is handled by ActivityItem
    const getActivityType = (message: string) => {
      const lowerMsg = message.toLowerCase();

      if (
        lowerMsg.includes("create") ||
        lowerMsg.includes("add") ||
        lowerMsg.includes("new")
      ) {
        return "create";
      }

      if (
        lowerMsg.includes("update") ||
        lowerMsg.includes("edit") ||
        lowerMsg.includes("change") ||
        lowerMsg.includes("modify")
      ) {
        return "update";
      }

      if (lowerMsg.includes("delete") || lowerMsg.includes("remove")) {
        return "delete";
      }

      return "default";
    };

    const type = getActivityType(activity.message);

    return type === statusFilter;
  });

  // Log to debug if needed
  // console.log("Filtered activities count:", filteredActivities.length);

  // Pagination logic
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentActivities = filteredActivities.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <CMSTabs
          defaultValue="all"
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto"
          tabs={[
            { value: "all", label: ui.status.all },
            { value: "create", label: ui.dashboard.activity.created },
            { value: "update", label: ui.dashboard.activity.updated },
            { value: "delete", label: ui.dashboard.activity.deleted },
          ]}
        />

        <div className="w-full sm:w-64">
          <CMSSearch
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder={ui.collectionList.searchActivity}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {currentActivities.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              {ui.collectionList.noEntriesTitle}
            </p>
          </div>
        ) : (
          currentActivities.map((activity) => (
            <ActivityItem key={activity.sha} activity={activity} />
          ))
        )}
      </div>

      {totalPages > 0 && (
        <CMSPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          limit={itemsPerPage}
          onLimitChange={(limit) => {
            setItemsPerPage(limit);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
