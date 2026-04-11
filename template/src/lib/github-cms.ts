import { Octokit } from "octokit";

import { env } from "@/lib/env";

export interface StatixUser {
  email: string;
  name: string;
}

function buildCommitMessage(
  action: string,
  path: string,
  user?: StatixUser,
): string {
  if (!user) return `${action} ${path}`;
  return `${action} ${path}\n\nstatix-user: ${user.email}\nstatix-name: ${user.name}\nstatix-action: ${action.toLowerCase()}\nstatix-time: ${new Date().toISOString()}`;
}

export interface GitHubFile {
  [key: string]: unknown;
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
  url?: string; // Optional GitHub raw URL
  status?: string; // Optional status field added by API
  title?: string; // Display title extracted from content
}

interface TrashItemContent {
  originalPath: string;
  deletedAt: string;
  type: "collection_item" | "media";
  data?: unknown;
}

export class GitHubCMS {
  public octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;

  constructor() {
    // env is already validated at import time via env.ts
    this.octokit = new Octokit({ auth: env.GITHUB_TOKEN });
    this.owner = env.GITHUB_OWNER;
    this.repo = env.GITHUB_REPO;
    this.branch = env.GITHUB_BRANCH;
  }

  /**
   * Get file content from GitHub
   */
  async getFile(
    path: string,
  ): Promise<{ content: unknown; sha: string } | null> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });

      if ("content" in response.data && response.data.type === "file") {
        const content = Buffer.from(response.data.content, "base64").toString(
          "utf-8",
        );

        return {
          content: JSON.parse(content),
          sha: response.data.sha,
        };
      }

      return null;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Save file to GitHub (create or update)
   */
  async saveFile(
    path: string,
    content: unknown,
    sha?: string,
    user?: StatixUser,
  ): Promise<void> {
    const message = buildCommitMessage(sha ? "Update" : "Create", path, user);
    const contentBase64 = Buffer.from(
      JSON.stringify(content, null, 2),
    ).toString("base64");

    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      content: contentBase64,
      branch: this.branch,
      ...(sha && { sha }),
    });
  }

  /**
   * Delete file from GitHub
   */
  async deleteFile(path: string, sha: string, user?: StatixUser): Promise<void> {
    await this.octokit.rest.repos.deleteFile({
      owner: this.owner,
      repo: this.repo,
      path,
      message: buildCommitMessage("Delete", path, user),
      sha,
      branch: this.branch,
    });
  }

  /**
   * Get all files in a collection folder
   */
  async getCollection(folderPath: string): Promise<GitHubFile[]> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: folderPath,
        ref: this.branch,
      });

      if (Array.isArray(response.data)) {
        return response.data
          .filter((item) => item.type === "file" && item.name.endsWith(".json"))
          .map((item) => ({
            name: item.name,
            path: item.path,
            sha: item.sha,
            size: item.size,
            type: item.type,
          }));
      }

      return [];
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        // Folder doesn't exist yet
        return [];
      }

      throw error;
    }
  }

  /**
   * List all files in a directory
   */
  /**
   * List all files in a directory
   */
  async listFiles(path: string, recursive = false): Promise<GitHubFile[]> {
    try {
      if (recursive) {
        // Use Git Trees API for recursive listing
        // First get the SHA of the branch
        const ref = await this.octokit.rest.git.getRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${this.branch}`,
        });
        const sha = ref.data.object.sha;

        const tree = await this.octokit.rest.git.getTree({
          owner: this.owner,
          repo: this.repo,
          tree_sha: sha,
          recursive: "1",
        });

        // Filter files that start with the path
        return tree.data.tree
          .filter((item) => item.path?.startsWith(path) && item.type === "blob")
          .map((item) => ({
            name: item.path?.split("/").pop() || "",
            path: item.path || "",
            sha: item.sha || "",
            size: item.size || 0,
            type: "file",
          }));
      }

      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });

      if (Array.isArray(response.data)) {
        return response.data.map((item) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          type: item.type,
        }));
      }

      return [];
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        return [];
      }

      throw error;
    }
  }
  /**
   * Get recent commits
   */
  async getRecentCommits(
    perPage = 5,
    path?: string,
    page = 1,
  ): Promise<
    Array<{
      sha: string;
      message: string;
      author: {
        name: string;
        email: string;
        date: string;
        avatar_url: string;
      };
      html_url?: string;
    }>
  > {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner: this.owner,
        repo: this.repo,
        sha: this.branch,
        per_page: perPage,
        page,
        ...(path && { path }),
      });

      return response.data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || "Unknown",
          email: commit.commit.author?.email || "",
          date: commit.commit.author?.date || "",
          avatar_url: commit.author?.avatar_url || "",
        },
        html_url: commit.html_url,
      }));
    } catch (error) {
      console.error("Failed to fetch commits:", error);

      return [];
    }
  }
  /**
   * Get last commit date for a specific path
   */
  async getLastCommitDate(path: string): Promise<string | null> {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner: this.owner,
        repo: this.repo,
        sha: this.branch,
        path,
        per_page: 1,
      });

      if (response.data.length > 0) {
        return response.data[0].commit.author?.date || null;
      }

      return null;
    } catch (error) {
      console.error(`Failed to fetch last commit for ${path}:`, error);

      return null;
    }
  }
  /**
   * Get API Rate Limit
   */
  async getRateLimit(): Promise<{
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const { data } = await this.octokit.rest.rateLimit.get();

    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: data.rate.reset,
    };
  }

  /**
   * Get Repository Details
   */
  async getRepoDetails(): Promise<{ size: number; open_issues: number }> {
    const { data } = await this.octokit.rest.repos.get({
      owner: this.owner,
      repo: this.repo,
    });

    return {
      size: data.size,
      open_issues: data.open_issues_count,
    };
  }
  /**
   * Move file (copy to new path, delete from old)
   */
  async moveFile(
    sourcePath: string,
    targetPath: string,
    sha: string,
    content?: unknown,
    user?: StatixUser,
  ): Promise<void> {
    // 1. Get content if not provided
    let fileContent = content;

    if (!fileContent) {
      const file = await this.getFile(sourcePath);

      if (!file) {
        throw new Error(`File not found: ${sourcePath}`);
      }

      fileContent = file.content;
    }

    // 2. Create at new path
    await this.saveFile(targetPath, fileContent, undefined, user);

    // 3. Delete from old path
    await this.deleteFile(sourcePath, sha, user);
  }

  /**
   * Update media URL references across all content JSON files
   */
  async updateMediaReferences(
    oldUrl: string,
    newUrl: string,
    user?: StatixUser,
  ): Promise<{ updatedFiles: string[] }> {
    const updatedFiles: string[] = [];
    const { statixConfig } = await import("@/statix.config");
    const allContentFiles: Array<{ path: string; sha: string }> = [];

    for (const collection of statixConfig.collections) {
      try {
        const files = await this.listFiles(collection.path, true);
        allContentFiles.push(
          ...files
            .filter((f) => f.name.endsWith(".json"))
            .map((f) => ({ path: f.path, sha: f.sha })),
        );
      } catch {
        // Collection folder might not exist
      }
    }

    for (const file of allContentFiles) {
      try {
        const fileData = await this.getFile(file.path);
        if (!fileData) continue;
        const contentStr = JSON.stringify(fileData.content);
        if (contentStr.includes(oldUrl)) {
          const newContentStr = contentStr.split(oldUrl).join(newUrl);
          await this.saveFile(file.path, JSON.parse(newContentStr), fileData.sha, user);
          updatedFiles.push(file.path);
        }
      } catch (error) {
        console.error(`Failed to update references in ${file.path}:`, error);
      }
    }

    return { updatedFiles };
  }

  /**
   * Soft delete file (move to trash)
   */
  async softDeleteFile(
    path: string,
    sha: string,
    type: "collection_item" | "media" = "collection_item",
    user?: StatixUser,
  ): Promise<void> {
    const file = await this.getFile(path);

    if (!file) {
      throw new Error(`File not found: ${path}`);
    }

    const trashItem = {
      originalPath: path,
      deletedAt: new Date().toISOString(),
      type,
      data: file.content,
    };

    const filename = path.split("/").pop();
    const trashPath = `content/trash/${filename}`;

    await this.saveFile(trashPath, trashItem, undefined, user);
    await this.deleteFile(path, sha, user);
  }

  /**
   * Get all items in trash
   */
  async getTrashItems(): Promise<
    Array<{
      name: string;
      path: string;
      originalPath: string;
      deletedAt: string;
      type: string;
    }>
  > {
    const trashItems: Array<{
      name: string;
      path: string;
      originalPath: string;
      deletedAt: string;
      type: string;
    }> = [];

    // 1. Get collection items
    const collectionFiles = await this.getCollection("content/trash");

    for (const file of collectionFiles) {
      const content = await this.getFile(file.path);

      if (content && content.content && typeof content.content === "object") {
        const data = content.content as unknown as TrashItemContent;

        if (data.originalPath && data.deletedAt) {
          trashItems.push({
            name: file.name,
            path: file.path,
            originalPath: data.originalPath,
            deletedAt: data.deletedAt,
            type: data.type || "collection_item",
          });
        }
      }
    }

    // 2. Get media items (metadata files)
    const mediaFiles = await this.getCollection("content/trash/media");

    for (const file of mediaFiles) {
      if (file.name.endsWith(".meta.json")) {
        const content = await this.getFile(file.path);

        if (content && content.content && typeof content.content === "object") {
          const data = content.content as unknown as TrashItemContent;

          if (data.originalPath && data.deletedAt) {
            trashItems.push({
              name: file.name.replace(".meta.json", ""),
              path: file.path, // Path to metadata file
              originalPath: data.originalPath,
              deletedAt: data.deletedAt,
              type: "media",
            });
          }
        }
      }
    }

    return trashItems.sort(
      (a, b) =>
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
    );
  }

  /**
   * Restore item from trash
   */
  async restoreTrashItem(trashPath: string, user?: StatixUser): Promise<void> {
    const file = await this.getFile(trashPath);

    if (!file) throw new Error("Trash item not found");

    const data = file.content as unknown as TrashItemContent;

    if (data.type === "media") {
      // Restore media
      const filename = trashPath.split("/").pop()?.replace(".meta.json", "");
      const trashMediaPath = `content/trash/media/${filename}`;

      // Get binary content
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: trashMediaPath,
        ref: this.branch,
      });

      if (!("content" in response.data)) {
        throw new Error("Failed to get media content");
      }

      // Restore to original path — buildCommitMessage ile kullanıcı bilgisi eklenir
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: data.originalPath,
        message: buildCommitMessage("Restore", filename ?? data.originalPath, user),
        content: response.data.content,
        branch: this.branch,
      });

      // Delete from trash (binary + meta)
      const binaryResponse = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: trashMediaPath,
        ref: this.branch,
      });

      if ("sha" in binaryResponse.data) {
        await this.deleteFile(trashMediaPath, binaryResponse.data.sha, user);
      }

      await this.deleteFile(trashPath, file.sha, user);
    } else {
      // Restore collection item
      await this.saveFile(data.originalPath, data.data, undefined, user);
      await this.deleteFile(trashPath, file.sha, user);
    }
  }

  /**
   * Permanently delete item from trash
   */
  async deleteTrashItem(path: string): Promise<void> {
    // If it's a media metadata file, we also need to delete the binary
    if (path.endsWith(".meta.json") && path.includes("content/trash/media")) {
      const binaryPath = path.replace(".meta.json", "");

      try {
        const binaryResponse = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: binaryPath,
          ref: this.branch,
        });

        if ("sha" in binaryResponse.data) {
          await this.deleteFile(binaryPath, binaryResponse.data.sha);
        }
      } catch (e) {
        console.log("Binary file not found or already deleted", e);
      }
    }

    const file = await this.getFile(path);

    if (file) {
      await this.deleteFile(path, file.sha);
    }
  }

  /**
   * Empty trash (delete all items)
   */
  async emptyTrash(): Promise<void> {
    const items = await this.getTrashItems();

    for (const item of items) {
      await this.deleteTrashItem(item.path);
    }
  }

  /**
   * Cleanup old trash items
   */
  async cleanupTrash(retentionDays = 10): Promise<void> {
    const items = await this.getTrashItems();
    const now = new Date().getTime();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const item of items) {
      const deletedAt = new Date(item.deletedAt).getTime();

      if (now - deletedAt > retentionMs) {
        console.log(`Auto-deleting old trash item: ${item.path}`);
        await this.deleteTrashItem(item.path);
      }
    }
  }
}

// Singleton instance
let githubCMS: GitHubCMS | null = null;

export function getGitHubCMS(): GitHubCMS {
  if (!githubCMS) {
    githubCMS = new GitHubCMS();
  }

  return githubCMS;
}
