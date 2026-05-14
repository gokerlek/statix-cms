import { O, pipe } from "@mobily/ts-belt";

import type { ContentStatus } from "@/statix/types/content";

/** All valid content statuses */
export const CONTENT_STATUSES: ContentStatus[] = [
  "draft",
  "published",
  "archived",
];

/** Default status for new or unset content */
export const DEFAULT_STATUS: string = "draft";

/** Resolve a nullable status to a valid status string */
export const resolveStatus = (status: string | undefined | null): string =>
  pipe(status, O.fromNullable, O.getWithDefault(DEFAULT_STATUS));

/** Capitalize first letter of status for display (e.g. "draft" → "Draft") */
export const formatStatus = (status: string): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

/** Chart config colors keyed by formatted status */
export const STATUS_CHART_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  Draft: { label: "draft", color: "var(--status-draft)" },
  Published: { label: "published", color: "var(--status-published)" },
  Archived: { label: "archived", color: "var(--status-archived)" },
};
