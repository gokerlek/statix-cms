import { StatixConfig } from "@/statix/types";
import type { RolePermissions } from "@/statix/types/permissions";

export const statixConfig: StatixConfig = {
  github: {
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
    branch: process.env.GITHUB_BRANCH || "main",
  },
  i18n: {
    locales: ["en", "tr"],
    defaultLocale: "en",
  },
  // Custom role presets (shown alongside Admin/Editor in user drawer)
  roles: [
    {
      name: "Translator",
      description: "Can view and edit content for translation purposes",
      permissions: {
        canManageUsers: false,
        canViewMonitor: false,
        canManageMedia: false,
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
    // ═══════════════════════════════════════════════════════════
    // SINGLETONS - Single pages with unique content
    // ═══════════════════════════════════════════════════════════
    {
      slug: "home",
      label: "Home Page",
      type: "singleton",
      path: "content/home",
      icon: "Home",
      fields: [
        {
          name: "title",
          label: "Page Title",
          type: "textarea",
          required: true,
          placeholder: "Welcome to our website",
          localized: true,
        },
        {
          name: "subtitle",
          label: "Subtitle",
          type: "text",
          placeholder: "Your tagline here",
          localized: true,
        },
        {
          name: "heroImage",
          label: "Hero Image",
          type: "image",
        },
        {
          name: "ctaText",
          label: "Button Text",
          type: "text",
          placeholder: "Get Started",
        },
        {
          name: "ctaLink",
          label: "Button Link",
          type: "text",
          placeholder: "/about",
        },
        {
          name: "metaTitle",
          label: "Meta Title",
          type: "text",
          placeholder: "Title for search engines",
        },
        {
          name: "metaDescription",
          label: "Meta Description",
          type: "textarea",
          rows: 2,
          placeholder: "Description for search results",
        },
        {
          name: "content",
          label: "Content Blocks",
          type: "blocks",
          localized: true,
          blocks: [
            {
              type: "text",
              label: "Text Section",
              fields: [
                {
                  name: "heading",
                  label: "Heading",
                  type: "text",
                },
                {
                  name: "content",
                  label: "Content",
                  type: "textarea",
                  rows: 5,
                },
              ],
            },
            {
              type: "image",
              label: "Image",
              fields: [
                {
                  name: "image",
                  label: "Image",
                  type: "image",
                  required: true,
                },
                {
                  name: "caption",
                  label: "Caption",
                  type: "text",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "about",
      label: "About Page",
      type: "singleton",
      path: "content/about",
      icon: "Info",
      fields: [
        {
          name: "title",
          label: "Page Title",
          type: "text",
          required: true,
          placeholder: "About Us",
          localized: true,
        },
        {
          name: "description",
          label: "Description",
          type: "richtext",
          placeholder: "Tell your story...",
          localized: true,
        },
        {
          name: "image",
          label: "Featured Image",
          type: "image",
        },
        {
          name: "mission",
          label: "Our Mission",
          type: "textarea",
          rows: 3,
          localized: true,
        },
        {
          name: "vision",
          label: "Our Vision",
          type: "textarea",
          rows: 3,
          localized: true,
        },
      ],
    },
    {
      slug: "contact",
      label: "Contact Page",
      type: "singleton",
      path: "content/contact",
      icon: "Mail",
      fields: [
        {
          name: "title",
          label: "Page Title",
          type: "text",
          required: true,
          placeholder: "Contact Us",
          localized: true,
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          rows: 3,
          localized: true,
        },
        {
          name: "email",
          label: "Email Address",
          type: "text",
          placeholder: "hello@example.com",
        },
        {
          name: "phone",
          label: "Phone Number",
          type: "text",
          placeholder: "+1 (555) 123-4567",
        },
        {
          name: "address",
          label: "Address",
          type: "textarea",
          rows: 3,
          placeholder: "123 Main Street\nCity, State 12345",
        },
        {
          name: "socialLinks",
          label: "Social Links",
          type: "list",
          fields: [
            {
              name: "platform",
              label: "Platform",
              type: "select",
              required: true,
              options: [
                { label: "Twitter / X", value: "twitter" },
                { label: "Instagram", value: "instagram" },
                { label: "LinkedIn", value: "linkedin" },
                { label: "Facebook", value: "facebook" },
                { label: "YouTube", value: "youtube" },
                { label: "GitHub", value: "github" },
              ],
            },
            {
              name: "url",
              label: "URL",
              type: "text",
              required: true,
              placeholder: "https://...",
            },
          ],
        },
      ],
    },

    // ───────────────────────────────────────────────────────────
    // Dev-only singleton: exercises every built-in field type so
    // you can visually verify editor rendering, dirty indicators,
    // image diff tooltips, localized blocks/lists, and save flow
    // without touching real content. Safe to delete in production.
    // ───────────────────────────────────────────────────────────
    {
      slug: "showcase",
      label: "Field Showcase",
      type: "singleton",
      path: "content/showcase",
      icon: "Flask",
      fields: [
        {
          name: "title",
          label: "Title (text)",
          type: "text",
          required: true,
          placeholder: "A short headline",
          localized: true,
        },
        {
          name: "summary",
          label: "Summary (textarea)",
          type: "textarea",
          rows: 3,
          placeholder: "Multi-line summary…",
          localized: true,
        },
        {
          name: "body",
          label: "Body (richtext)",
          type: "richtext",
          placeholder: "Rich editor — bold, italic, lists, links…",
          localized: true,
        },
        {
          name: "hero",
          label: "Hero Image (image)",
          type: "image",
        },
        {
          name: "brochure",
          label: "Brochure (file)",
          type: "file",
          accept: [".pdf", ".doc", ".docx"],
        },
        {
          name: "rating",
          label: "Rating (number)",
          type: "number",
          min: 0,
          max: 10,
        },
        {
          name: "status",
          label: "Custom Status (select)",
          type: "select",
          options: [
            { label: "Draft", value: "draft" },
            { label: "In review", value: "review" },
            { label: "Approved", value: "approved" },
          ],
        },
        {
          name: "publishedAt",
          label: "Published At (date)",
          type: "date",
        },
        {
          name: "featured",
          label: "Featured? (checkbox)",
          type: "checkbox",
          defaultChecked: false,
        },
        {
          name: "showOnHome",
          label: "Show on home (switch)",
          type: "switch",
          defaultChecked: true,
        },
        {
          name: "tags",
          label: "Tags (list)",
          type: "list",
          fields: [
            {
              name: "label",
              label: "Label",
              type: "text",
              required: true,
              placeholder: "javascript",
            },
            {
              name: "color",
              label: "Color",
              type: "select",
              options: [
                { label: "Gray", value: "gray" },
                { label: "Blue", value: "blue" },
                { label: "Green", value: "green" },
                { label: "Red", value: "red" },
              ],
            },
          ],
        },
        {
          name: "sections",
          label: "Sections (blocks, localized)",
          type: "blocks",
          localized: true,
          blocks: [
            {
              type: "heading",
              label: "Heading",
              fields: [
                { name: "text", label: "Heading text", type: "text" },
                {
                  name: "level",
                  label: "Level",
                  type: "select",
                  options: [
                    { label: "H2", value: "h2" },
                    { label: "H3", value: "h3" },
                  ],
                },
              ],
            },
            {
              type: "paragraph",
              label: "Paragraph",
              fields: [
                {
                  name: "text",
                  label: "Paragraph text",
                  type: "textarea",
                  rows: 3,
                },
              ],
            },
            {
              type: "media",
              label: "Media",
              fields: [
                { name: "image", label: "Image", type: "image", required: true },
                { name: "caption", label: "Caption", type: "text" },
              ],
            },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // COLLECTIONS - Repeatable content items
    // ═══════════════════════════════════════════════════════════
    {
      slug: "blog",
      label: "Blog Posts",
      path: "content/blog",
      icon: "FileText",
      titleField: "title",
      fields: [
        {
          name: "title",
          label: "Title",
          type: "text",
          required: true,
          placeholder: "Post title...",
          localized: true,
        },
        {
          name: "excerpt",
          label: "Excerpt",
          type: "textarea",
          rows: 2,
          placeholder: "A brief summary of this post...",
          localized: true,
        },
        {
          name: "featuredImage",
          label: "Featured Image",
          type: "image",
        },
        {
          name: "date",
          label: "Publish Date",
          type: "date",
          required: true,
        },
        {
          name: "content",
          label: "Content",
          type: "richtext",
          localized: true,
          placeholder: "Write your post...",
        },
      ],
    },
    {
      slug: "team",
      label: "Team",
      path: "content/team",
      icon: "Users",
      titleField: "name",
      fields: [
        {
          name: "name",
          label: "Full Name",
          type: "text",
          required: true,
          placeholder: "John Doe",
        },
        {
          name: "role",
          label: "Role / Position",
          type: "text",
          required: true,
          placeholder: "Software Engineer",
        },
        {
          name: "photo",
          label: "Photo",
          type: "image",
        },
        {
          name: "bio",
          label: "Bio",
          type: "textarea",
          rows: 4,
          placeholder: "A short bio...",
          localized: true,
        },
        {
          name: "email",
          label: "Email",
          type: "text",
          placeholder: "john@example.com",
        },
        {
          name: "socialLinks",
          label: "Social Links",
          type: "list",
          fields: [
            {
              name: "platform",
              label: "Platform",
              type: "select",
              required: true,
              options: [
                { label: "LinkedIn", value: "linkedin" },
                { label: "Twitter / X", value: "twitter" },
                { label: "GitHub", value: "github" },
                { label: "Website", value: "website" },
              ],
            },
            {
              name: "url",
              label: "URL",
              type: "text",
              required: true,
            },
          ],
        },
      ],
    },
  ],
};
