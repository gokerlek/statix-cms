# Statix CMS

A modern, Git-based headless CMS built with Next.js 15, React 19, and Tailwind CSS 4. Uses GitHub as the database and features a powerful content editor with drag-and-drop functionality.

## ✨ Features

- 🔐 **Authentication**: NextAuth.js v5 with GitHub OAuth and email whitelist
- 📝 **Block Editor**: Drag-and-drop content blocks (Markdown, Images, Rich Text)
- 🌍 **Multi-language**: Built-in i18n support with localized fields
- 🎨 **Modern UI**: Beautiful admin interface with Tailwind CSS 4
- 📦 **GitHub Storage**: All content stored as JSON files in your GitHub repository
- 🖼️ **Media Library**: Upload, organize, and manage images with folder support
- 🗑️ **Trash System**: Soft delete with restore functionality
- 📱 **Responsive**: Works seamlessly on all devices

## 🚀 Quick Start

```bash
npx create-statix-cms my-project
cd my-project
```

---

## 📋 Setup

### Step 1: Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new **public** or **private** repository
3. You can leave it empty - Statix CMS will create the folder structure automatically
4. Note your **username** and **repository name** for later

---

### Step 2: Create GitHub Personal Access Token (Classic)

> ⚠️ **Important**: Use **Tokens (classic)**, NOT "Fine-grained tokens". Fine-grained tokens may cause permission issues.

1. Go to: **GitHub** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**

   - Direct link: [github.com/settings/tokens](https://github.com/settings/tokens)

2. Click **"Generate new token"** → **"Generate new token (classic)"**

3. Configure the token:
   - **Note**: `Statix CMS` (or any name you prefer)
   - **Expiration**: Choose based on your needs (No expiration for convenience, or set a date)
   - **Scopes**: Check ✅ **`repo`** (this gives full control of repositories)
4. Click **"Generate token"**

5. **⚠️ Copy the token immediately!** It starts with `ghp_` and won't be shown again.

---

### Step 3: Create GitHub OAuth App

This enables login with GitHub for the admin panel.

1. Go to: **GitHub** → **Settings** → **Developer settings** → **OAuth Apps**

   - Direct link: [github.com/settings/developers](https://github.com/settings/developers)

2. Click **"New OAuth App"**

3. Fill in the form:
   | Field | Value |
   |-------|-------|
   | **Application name** | `Statix CMS` (or any name) |
   | **Homepage URL** | `http://localhost:3000` |
   | **Authorization callback URL** | `http://localhost:3000/api/auth/callback/github` |

4. Click **"Register application"**

5. On the next page:
   - Copy the **Client ID** (looks like: `Ov23liXXXXXXXXXX`)
   - Click **"Generate a new client secret"**
   - Copy the **Client Secret** (looks like: `abc123def456...`)

---

### Step 4: Configure Environment Variables

Edit the `.env` file in your project root:

```env
# ═══════════════════════════════════════════════════════════
# GitHub Configuration
# ═══════════════════════════════════════════════════════════
# Your Personal Access Token (Classic) - starts with ghp_
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Your GitHub username
GITHUB_OWNER=YourUsername

# Your repository name (case-sensitive!)
GITHUB_REPO=your-repo-name

# Branch to use (usually 'main')
GITHUB_BRANCH=main

# ═══════════════════════════════════════════════════════════
# NextAuth Configuration
# ═══════════════════════════════════════════════════════════
# Generate with: openssl rand -base64 32
AUTH_SECRET=your_generated_secret_here

# From your OAuth App
AUTH_GITHUB_ID=Ov23liXXXXXXXXXX
AUTH_GITHUB_SECRET=your_client_secret_here

# ═══════════════════════════════════════════════════════════
# Access Control
# ═══════════════════════════════════════════════════════════
# Comma-separated list of emails allowed to access admin
ADMIN_EMAILS=your@email.com

# ═══════════════════════════════════════════════════════════
# URLs
# ═══════════════════════════════════════════════════════════
NEXTAUTH_URL=http://localhost:3000

# For serving images from GitHub (replace with your info)
NEXT_PUBLIC_MEDIA_BASE_URL=https://raw.githubusercontent.com/YourUsername/your-repo-name/main
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

### Step 5: Run Development Server

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ❓ Troubleshooting

### "Failed to save content" or 500 Error

**Most common cause:** GitHub token issue

1. **Are you using a Classic token?**

   - ❌ Fine-grained tokens may not work properly
   - ✅ Use **Tokens (classic)** with `repo` scope

2. **Is the token valid?**

   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user
   ```

   If you get an error, generate a new token.

3. **Did you restart the dev server?**

   - After changing `.env`, you must restart: `Ctrl+C` then `npm run dev`

4. **Is the repository name correct?**
   - Repository names are case-sensitive
   - Double-check `GITHUB_OWNER` and `GITHUB_REPO`

### "Unauthorized" or Login Issues

1. **Check OAuth App settings:**

   - Callback URL must be exactly: `http://localhost:3000/api/auth/callback/github`

2. **Is your email in ADMIN_EMAILS?**

   - The email must match your GitHub account's primary email

3. **Did you set AUTH_SECRET?**
   - Generate with: `openssl rand -base64 32`

### Images Not Loading

1. **Check NEXT_PUBLIC_MEDIA_BASE_URL:**

   - ❌ Wrong: `https://github.com/user/repo/...`
   - ✅ Correct: `https://raw.githubusercontent.com/user/repo/main`

2. **Is the repository public?**
   - Private repos require authentication for raw content

## ⚙️ Configuration

All configuration is done in `src/statix.config.ts`. Here's a complete reference:

### Root Configuration

```typescript
export const statixConfig: StatixConfig = {
  github: {
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
    branch: process.env.GITHUB_BRANCH || "main",
  },
  mediaFolder: "public/uploads",     // Where to store uploaded files
  maxUploadSize: 5 * 1024 * 1024,    // Optional: Max file size (default: 5MB)
  i18n: {                            // Optional: Multi-language support
    locales: ["en", "tr"],
    defaultLocale: "en",
  },
  collections: [...],
};
```

### Collection Configuration

```typescript
{
  slug: "blog",                    // URL-friendly identifier
  label: "Blog Posts",             // Display name in sidebar
  type: "collection",              // "collection" (multiple items) or "singleton" (single item)
  path: "content/blog",            // Folder path in repository
  icon: "FileText",                // Lucide icon name (optional)
  identifierField: "slug",         // Field used as filename (optional, default: "slug")
  titleField: "title",             // Field displayed in list view (optional)
  fields: [...],
}
```

#### Collection Types

| Type         | Description                                     |
| ------------ | ----------------------------------------------- |
| `collection` | Multiple items (e.g., blog posts, team members) |
| `singleton`  | Single item (e.g., site settings, homepage)     |

#### Available Icons

Icons are from [Lucide](https://lucide.dev/icons/). Common examples:

- `FileText` - Documents
- `Users` - Team/People
- `Settings` - Configuration
- `Home` - Homepage
- `Image` - Gallery
- `Mail` - Contact
- `Calendar` - Events

---

## 📝 Field Types

### Text Field

Single-line text input.

```typescript
{
  name: "title",
  label: "Title",
  type: "text",
  required: true,           // Optional: Make field required
  placeholder: "Enter...",  // Optional: Placeholder text
  localized: true,          // Optional: Enable per-language values
}
```

### Textarea Field

Multi-line text input.

```typescript
{
  name: "description",
  label: "Description",
  type: "textarea",
  rows: 5,                  // Optional: Number of visible rows (default: 3)
  placeholder: "Write...",
  localized: true,
}
```

### Image Field

Image upload with preview.

```typescript
{
  name: "featuredImage",
  label: "Featured Image",
  type: "image",
  required: true,
}
```

### File Field

General file upload (PDFs, documents, etc.).

```typescript
{
  name: "resume",
  label: "Resume",
  type: "file",
  accept: [".pdf", ".doc", ".docx"],  // Optional: Allowed file types
  maxSize: 10 * 1024 * 1024,          // Optional: Max size in bytes
}
```

### Number Field

Numeric input with optional min/max.

```typescript
{
  name: "price",
  label: "Price",
  type: "number",
  min: 0,        // Optional: Minimum value
  max: 10000,    // Optional: Maximum value
}
```

### Select Field

Dropdown selection.

```typescript
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
}
```

### Date Field

Date picker.

```typescript
{
  name: "publishDate",
  label: "Publish Date",
  type: "date",
  required: true,
}
```

### Checkbox Field

Simple checkbox.

```typescript
{
  name: "showAuthor",
  label: "Show Author",
  type: "checkbox",
  defaultChecked: false,  // Optional: Default value
}
```

### Switch Field

Toggle switch (on/off).

```typescript
{
  name: "isFeatured",
  label: "Featured",
  type: "switch",
  defaultChecked: false,
}
```

### List Field

Repeatable group of fields.

```typescript
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
      required: true,
    },
  ],
}
```

### Blocks Field

Drag-and-drop content blocks for rich content editing.

```typescript
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
        },
      ],
    },
    {
      type: "image",
      label: "Image",
      fields: [
        { name: "image", label: "Image", type: "image", required: true },
        { name: "caption", label: "Caption", type: "text" },
        { name: "alt", label: "Alt Text", type: "text" },
      ],
    },
    {
      type: "quote",
      label: "Quote",
      fields: [
        { name: "text", label: "Quote", type: "textarea", rows: 3 },
        { name: "author", label: "Author", type: "text" },
      ],
    },
  ],
}
```

---

## 🌍 Localization (i18n)

Enable multi-language support in your configuration:

```typescript
i18n: {
  locales: ["en", "tr", "de"],  // Supported languages
  defaultLocale: "en",          // Fallback language
},
```

Then mark fields as localized:

```typescript
{
  name: "title",
  label: "Title",
  type: "text",
  localized: true,  // This field will have separate values per language
}
```

**How it works:**

- Localized fields show a language switcher in the editor
- Non-localized fields (like images, dates) are shared across languages
- Content is stored with language-specific values in JSON

---

## 📁 Complete Example

Here's a full `statix.config.ts` example:

```typescript
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
    // Singleton: Site Settings
    {
      slug: "settings",
      label: "Site Settings",
      type: "singleton",
      path: "content/settings",
      icon: "Settings",
      fields: [
        { name: "title", label: "Site Title", type: "text", required: true },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          localized: true,
        },
        { name: "logo", label: "Logo", type: "image" },
      ],
    },

    // Collection: Blog Posts
    {
      slug: "blog",
      label: "Blog Posts",
      path: "content/blog",
      icon: "FileText",
      identifierField: "slug",
      titleField: "title",
      fields: [
        {
          name: "title",
          label: "Title",
          type: "text",
          required: true,
          localized: true,
        },
        { name: "slug", label: "Slug", type: "text", required: true },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "featuredImage", label: "Image", type: "image" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
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
                { name: "caption", label: "Caption", type: "text" },
              ],
            },
          ],
        },
      ],
    },

    // Collection: Team Members
    {
      slug: "team",
      label: "Team",
      path: "content/team",
      icon: "Users",
      titleField: "name",
      fields: [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "position", label: "Position", type: "text", required: true },
        { name: "avatar", label: "Photo", type: "image" },
        { name: "bio", label: "Bio", type: "textarea", localized: true },
        {
          name: "socialLinks",
          label: "Social Links",
          type: "list",
          fields: [
            { name: "platform", label: "Platform", type: "text" },
            { name: "url", label: "URL", type: "text" },
          ],
        },
      ],
    },
  ],
};
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables
4. Update `NEXTAUTH_URL` to your production URL
5. Update GitHub OAuth callback URL to `https://your-domain.com/api/auth/callback/github`
6. Deploy!

### Other Platforms

Statix CMS works on any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- Self-hosted with Docker

---

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
