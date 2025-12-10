# Statix CMS

A modern, Git-based headless CMS built with Next.js 15, React 19, and Tailwind CSS 4. Uses GitHub as the database and features a powerful content editor with drag-and-drop functionality.

## Features

- 🔐 **Authentication**: NextAuth.js v5 with GitHub OAuth and email whitelist
- 📝 **Block Editor**: Drag-and-drop content blocks (Markdown, Images, Rich Text)
- 🎨 **Modern UI**: Beautiful admin interface with Tailwind CSS 4
- 📦 **GitHub Storage**: All content stored as JSON files in your GitHub repository
- 🖼️ **Image Uploads**: Direct image uploads to GitHub
- 🔄 **Real-time Updates**: Automatic revalidation after content changes
- 📱 **Responsive**: Works seamlessly on all devices

## Quick Start

```bash
npx create-statix-cms my-project
cd my-project
```

## Setup

### 1. Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Statix CMS
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and generate a **Client Secret**

### 2. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: ✅ `repo` (Full control of private repositories)
4. Copy the token

### 3. Configure Environment Variables

Edit `.env` file with your values:

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repo_name
GITHUB_BRANCH=main

# NextAuth Configuration
AUTH_SECRET=your_random_secret_here
AUTH_GITHUB_ID=your_oauth_app_client_id
AUTH_GITHUB_SECRET=your_oauth_app_client_secret

# Admin Access Control
ADMIN_EMAILS=your@email.com

# Next.js
NEXTAUTH_URL=http://localhost:3000

# GitHub Media Base URL
NEXT_PUBLIC_MEDIA_BASE_URL=https://raw.githubusercontent.com/username/repo/main
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 4. Configure Your Collections

Edit `src/statix.config.ts` to define your content structure:

```typescript
export const cmsConfig: CmsConfig = {
  github: {
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
    branch: process.env.GITHUB_BRANCH || "main",
  },
  mediaFolder: "public/uploads",
  collections: [
    {
      slug: "posts",
      label: "Blog Posts",
      path: "content/posts",
      fields: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "content", label: "Content", type: "textarea" },
      ],
    },
  ],
};
```

### 5. Run Development Server

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Field Types

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `textarea` | Multi-line text input |
| `image` | Image upload |
| `file` | File upload |
| `number` | Number input |
| `select` | Dropdown select |
| `checkbox` | Checkbox |
| `switch` | Toggle switch |
| `date` | Date picker |
| `list` | Repeatable list of fields |
| `blocks` | Block editor with custom block types |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables
4. Update `NEXTAUTH_URL` to your production URL
5. Update GitHub OAuth callback URL
6. Deploy!

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
