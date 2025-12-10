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
          type: "text",
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
          name: "content",
          label: "Content",
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
          type: "textarea",
          rows: 4,
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
          type: "blocks",
          localized: true,
          blocks: [
            {
              type: "markdown",
              label: "Markdown",
              fields: [
                {
                  name: "content",
                  label: "Content",
                  type: "textarea",
                  rows: 10,
                  placeholder: "# Write your content here...",
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
                {
                  name: "alt",
                  label: "Alt Text",
                  type: "text",
                  placeholder: "Describe the image...",
                },
              ],
            },
            {
              type: "quote",
              label: "Quote",
              fields: [
                {
                  name: "text",
                  label: "Quote",
                  type: "textarea",
                  rows: 3,
                },
                {
                  name: "author",
                  label: "Author",
                  type: "text",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: "people",
      label: "People",
      path: "content/people",
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
