/**
 * GitHub API response types
 */

/**
 * Commit author information
 */
export interface GitHubCommitAuthor {
  name: string;
  email: string;
  date: string;
  avatar_url: string;
}

/**
 * GitHub commit data returned from API
 */
export interface GitHubCommit {
  sha: string;
  message: string;
  author: GitHubCommitAuthor;
}

/**
 * Media activity action types
 */
export type MediaAction = "upload" | "delete" | "trash" | "restore" | "unknown";

/**
 * Media activity status
 */
export type MediaStatus = "live" | "trash" | "deleted" | "restored";

/**
 * Enhanced commit data for media activity tracking
 */
export interface MediaActivityItem extends GitHubCommit {
  filename: string;
  action: MediaAction;
  status: MediaStatus;
  url: string | null;
}
