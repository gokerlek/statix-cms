import { StatixConfig } from "@/statix/types";
import type { RolePermissions } from "@/statix/types/permissions";

/**
 * Statix CMS configuration.
 *
 * - `github`: where your content JSON lives (a separate repo of your choice)
 * - `i18n`: which locales you ship content in
 * - `roles`: custom permission presets shown next to the built-in
 *   Admin/Editor in the user drawer
 * - `collections`: the heart of the CMS — every entry defines a content type
 *
 * Two collection examples are included to show both patterns. Delete or
 * extend them as you build your own content model.
 */
export const statixConfig: StatixConfig = {
  github: {
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
    branch: process.env.GITHUB_BRANCH || "main",
  },

  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  // Custom role presets shown alongside Admin/Editor in the user drawer.
  // Delete this array (or set `roles: []`) if you don't need extra roles.
  roles: [
    {
      name: "Translator",
      description: "Can view and edit content for translation purposes",
      permissions: {
        canManageUsers: false,
        canViewMonitor: false,
        canManageMedia: false,
        canManageFiles: false,
        canManageTrash: false,
        collections: {
          "*": {
            canView: true,
            canCreate: false,
            canEdit: true,
            canDelete: false,
            canPublish: false,
          },
        },
      } satisfies RolePermissions,
    },
  ],

  collections: [
    // ─────────────────────────────────────────────────────────────────────
    // Collection example — many entries with the same shape (blog posts,
    // products, recipes, etc.). Each entry is a JSON file in your GitHub
    // repo at `{path}/{id}.json`.
    // ─────────────────────────────────────────────────────────────────────
    {
      slug: "posts",
      label: "Posts",
      type: "collection",
      path: "content/posts",
      fields: [
        {
          name: "title",
          label: "Title",
          type: "text",
          required: true,
          placeholder: "A short, descriptive title",
          localized: true,
        },
        {
          name: "summary",
          label: "Summary",
          type: "textarea",
          rows: 3,
          placeholder: "One or two sentences shown in lists and previews",
          localized: true,
        },
        {
          name: "body",
          label: "Body",
          type: "richtext",
          placeholder: "Write the full post here",
          localized: true,
        },
        {
          name: "cover",
          label: "Cover image",
          type: "image",
        },
        {
          name: "publishedAt",
          label: "Published at",
          type: "date",
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // Singleton example — a single page with a fixed shape (about page,
    // homepage hero, contact info, etc.). Lives at `{path}/index.json`.
    // ─────────────────────────────────────────────────────────────────────
    {
      slug: "homepage",
      label: "Homepage",
      type: "singleton",
      path: "content/homepage",
      fields: [
        {
          name: "headline",
          label: "Headline",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "subheadline",
          label: "Subheadline",
          type: "textarea",
          rows: 2,
          localized: true,
        },
        {
          name: "hero",
          label: "Hero image",
          type: "image",
        },
      ],
    },
  ],
};
