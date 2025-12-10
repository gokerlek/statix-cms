# Statix CMS

A modern, Git-based headless CMS built with Next.js 15, React 19, and Tailwind CSS 4.

[![npm version](https://badge.fury.io/js/create-statix-cms.svg)](https://www.npmjs.com/package/create-statix-cms)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### Content Management

- 📝 **Block Editor** - Drag-and-drop content blocks (Markdown, Images, Rich Text)
- 🌍 **Multi-language** - Built-in i18n with per-field localization
- � **Flexible Fields** - Text, images, files, lists, selects, dates, and more
- 🔖 **Singletons & Collections** - Manage both single pages and repeatable content

### Media & Storage

- 🖼️ **Media Library** - Upload, organize, and browse images with folder support
- ⚡ **Vercel CDN Ready** - Images stored in `/public` for automatic CDN optimization
- 📁 **GitHub as Database** - Content stored as JSON files, media as actual files

### Safety & Recovery

- 🗑️ **Trash System** - Soft delete with restore functionality for content and media
- � **Local Drafts** - Unsaved changes stored locally, never lose your work
- ⚠️ **Unsaved Warnings** - Alerts before navigating away with pending changes
- ↩️ **Discard Changes** - Easily revert to the last saved version

### Security & Access

- 🔐 **GitHub OAuth** - Secure authentication with NextAuth.js v5
- 📧 **Email Whitelist** - Control who can access the admin panel
- 🛡️ **Rate Limiting** - Built-in API protection

### Developer Experience

- ⚡ **Next.js 15** - Latest App Router with React 19
- 🎨 **Modern UI** - Beautiful interface with Tailwind CSS 4 + shadcn/ui
- 📱 **Responsive** - Works perfectly on desktop and mobile

## 💡 Not a Dependency — It's Your Code

Unlike traditional npm packages, **Statix CMS is not installed as a dependency**. When you run `npx create-statix-cms`, you get a complete, standalone codebase that you fully own and control.

This approach means:

- ✅ **Full Control** - Modify any file, component, or feature
- ✅ **No Vendor Lock-in** - The code is yours, forever
- ✅ **No Breaking Updates** - You decide when and what to update
- ✅ **Learn & Customize** - Understand exactly how everything works

## 🚀 Quick Start

### Create a new project

```bash
npx create-statix-cms
```

Or with a project name:

```bash
npx create-statix-cms my-cms
```

### Configure your project

1. **Edit collections** - Configure your content types in `src/statix.config.ts`
2. **Set environment variables** - Fill in `.env` with your GitHub credentials
3. **Start developing** - Run `npm run dev` or `bun run dev`

## 📋 Environment Variables

Create a `.env` file with the following variables:

```env
# GitHub Configuration
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_username
GITHUB_REPO=your_repo_name
GITHUB_BRANCH=main

# NextAuth Configuration
AUTH_SECRET=generate_with_openssl_rand_base64_32
AUTH_GITHUB_ID=your_github_oauth_app_id
AUTH_GITHUB_SECRET=your_github_oauth_app_secret

# Admin Access Control
ADMIN_EMAILS=your@email.com

# Next.js
NEXTAUTH_URL=http://localhost:3000

# Media URL
NEXT_PUBLIC_MEDIA_BASE_URL=https://raw.githubusercontent.com/username/repo/main
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Authentication**: NextAuth.js v5
- **State Management**: Zustand + TanStack Query
- **Database**: GitHub Repository (JSON files)
- **Language**: TypeScript

## 📖 Documentation

For detailed documentation and configuration options, see the [full documentation](./template/README.md) in the generated project.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [gokerlek](https://github.com/gokerlek)
