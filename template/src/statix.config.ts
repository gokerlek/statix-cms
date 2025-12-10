import { StatixConfig } from "@/types";

export const statixConfig: StatixConfig = {
  github: {
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
    branch: process.env.GITHUB_BRANCH || "main",
  },
  mediaFolder: "public/uploads",
  i18n: {
    locales: ["en", "tr"],
    defaultLocale: "en",
  },
  collections: [
    {
      slug: "settings",
      label: "Site Settings",
      type: "singleton",
      path: "content/settings",
      icon: "Settings",
      fields: [
        {
          name: "title",
          label: "Site Title",
          type: "text",
          required: true,
          placeholder: "My Awesome Site",
        },
        {
          name: "description",
          label: "Site Description",
          type: "textarea",
          rows: 3,
        },
        {
          name: "logo",
          label: "Logo",
          type: "image",
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
              options: [
                { label: "Twitter", value: "twitter" },
                { label: "GitHub", value: "github" },
                { label: "LinkedIn", value: "linkedin" },
              ],
            },
            {
              name: "url",
              label: "URL",
              type: "text",
            },
          ],
        },
      ],
    },
    {
      slug: "blog",
      label: "Blog Posts",
      path: "content/blog",
      identifierField: "slug",
      titleField: "title",
      icon: "FileText",
      fields: [
        {
          name: "title",
          label: "Title",
          type: "text",
          required: true,
          placeholder: "Enter post title...",
          localized: true,
        },

        {
          name: "date",
          label: "Publish Date",
          type: "date",
          required: true,
          localized: false,
        },
        {
          name: "excerpt",
          label: "Excerpt",
          type: "textarea",
          placeholder: "Brief description of the post...",
          rows: 3,
          localized: true,
        },
        {
          name: "featuredImage",
          label: "Featured Image",
          type: "image",
          localized: false,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Archived", value: "archived" },
          ],
          localized: false,
        },
        {
          name: "isFeatured",
          label: "Featured Post",
          type: "switch",
          localized: false,
        },
        {
          name: "showAuthor",
          label: "Show Author",
          type: "checkbox",
          localized: false,
        },
        {
          name: "content",
          label: "Content Blocks",
          type: "blocks",
          required: false,
          localized: true,
          blocks: [
            {
              type: "markdown",
              label: "Markdown",
              fields: [
                {
                  name: "content",
                  label: "Markdown Content",
                  type: "textarea",
                  placeholder: "# Write your markdown here...",
                  rows: 10,
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
                  placeholder: "Image caption (optional)",
                },
                {
                  name: "alt",
                  label: "Alt Text",
                  type: "text",
                  placeholder: "Describe the image for accessibility",
                },
              ],
            },
            {
              type: "text",
              label: "Rich Text",
              fields: [
                {
                  name: "content",
                  label: "Text Content",
                  type: "textarea",
                  placeholder: "Enter your text content...",
                  rows: 5,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "team",
      label: "Team Members",
      path: "content/team",
      identifierField: "slug",
      titleField: "name",
      icon: "Users",
      fields: [
        {
          name: "avatar",
          label: "Avatar",
          type: "image",
          required: true,
        },
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          placeholder: "John",
        },
        {
          name: "surname",
          label: "Surname",
          type: "text",
          required: true,
          placeholder: "Doe",
        },
        {
          name: "position",
          label: "Position",
          type: "text",
          required: true,
          placeholder: "Senior Developer",
        },
        {
          name: "bio",
          label: "Bio",
          type: "textarea",
          placeholder: "Brief bio about the team member...",
          rows: 4,
          localized: true,
        },
        {
          name: "email",
          label: "Email",
          type: "text",
          placeholder: "john@example.com",
        },
        {
          name: "phone",
          label: "Phone",
          type: "text",
          placeholder: "+90 555 123 4567",
        },
        {
          name: "cv",
          label: "CV",
          type: "file",
        },
        {
          name: "socialLinks",
          label: "Social Links",
          type: "list",
          fields: [
            {
              name: "icon",
              label: "Icon",
              type: "select",
              required: true,
              options: [
                { label: "LinkedIn", value: "linkedin" },
                { label: "Twitter", value: "twitter" },
                { label: "GitHub", value: "github" },
                { label: "Instagram", value: "instagram" },
                { label: "Facebook", value: "facebook" },
                { label: "Website", value: "website" },
              ],
            },
            {
              name: "label",
              label: "Label",
              type: "text",
              required: true,
              placeholder: "LinkedIn Profile",
            },
            {
              name: "link",
              label: "Link",
              type: "text",
              required: true,
              placeholder: "https://linkedin.com/in/johndoe",
            },
          ],
        },
        {
          name: "skills",
          label: "Skills",
          type: "list",
          fields: [
            {
              name: "skill",
              label: "Skill",
              type: "text",
              required: true,
              placeholder: "React, TypeScript, etc.",
            },
          ],
        },
      ],
    },
  ],
};
