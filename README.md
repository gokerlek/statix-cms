# Statix CMS

A modern, Git-based headless CMS built with Next.js 16, React 19, and Tailwind CSS 4.

[![npm version](https://img.shields.io/npm/v/create-statix-cms.svg)](https://www.npmjs.com/package/create-statix-cms)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Get started

```bash
npx create-statix-cms my-cms
cd my-cms
npm run dev
```

> ⚠️ **Don't** run `npm install create-statix-cms`. This is a **scaffolder**, not a runtime dependency — `npm install` would add it to your project's dependencies and do nothing. Use `npx` (or `npm init statix-cms my-cms`, or `bun create statix-cms my-cms`).

---

## Table of Contents

- [What is Statix CMS?](#what-is-statix-cms)
- [How It Works](#how-it-works)
- [Features](#features)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Configuration](#configuration)
- [Content Modeling](#content-modeling)
- [Roles & Permissions](#roles--permissions)
- [Admin Panel](#admin-panel)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Tech Stack](#tech-stack)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## What is Statix CMS?

Statix CMS is a **free, lightweight content management system** that uses GitHub as its content database, Cloudflare R2 for media storage, and Turso for user/auth data.

### Not a Dependency — It's Your Code

Unlike traditional CMS packages, Statix CMS is **not installed as a dependency**. When you run `npx create-statix-cms`, you get a complete, standalone Next.js application that you fully own and control.

- **Full Control** — Modify any file, component, or feature
- **No Vendor Lock-in** — The code is yours, forever
- **No Breaking Updates** — You decide when and what to update
- **Learn & Customize** — Understand exactly how everything works

---

## How It Works

Statix CMS uses a unique architecture that separates concerns across three services:

```
┌─────────────────────────────────────────────────────┐
│                   Admin Panel                       │
│              (Next.js App Router)                   │
└──────┬──────────────┬──────────────┬────────────────┘
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│  GitHub  │   │    R2    │   │  Turso   │
│  (JSON)  │   │ (Media)  │   │ (Users)  │
│          │   │          │   │          │
│ Content  │   │ Images   │   │ Sessions │
│ Version  │   │ Files    │   │ Audit    │
│ History  │   │ Uploads  │   │ Invites  │
└──────────┘   └──────────┘   └──────────┘
```

### Content Storage — GitHub

All content is stored as **JSON files** in a GitHub repository. Every save creates a Git commit, giving you full version history for free. Commit messages include metadata:

```
Update content/blog/my-post.json

statix-user: editor@example.com
statix-name: Jane Editor
statix-action: update
statix-time: 2025-04-14T12:30:00Z
```

### Media Storage — Cloudflare R2

Images and files are uploaded to **Cloudflare R2** (S3-compatible object storage) and served via a public URL. Media can be organized into folders, moved, and tracked for references across content.

### User Database — Turso

User accounts, sessions, audit logs, and invitations are stored in **Turso** (serverless SQLite). This keeps auth data separate from content and supports edge-compatible session validation.

### Authentication — Better Auth

Login is handled by **Better Auth** with three methods:
- **Email OTP** — One-time password sent via Resend
- **GitHub OAuth** — Sign in with GitHub (optional)
- **Google OAuth** — Sign in with Google (optional)

---

## Features

### Content Management

- **Singletons & Collections** — Single pages (home, about) and repeatable content (blog posts, team members)
- **Block Editor** — Drag-and-drop content blocks (Markdown, Image, Quote, Text) with custom block definitions
- **Rich Text Editor** — ProseKit-based WYSIWYG with toolbar (bold, italic, underline, links, font size, text align, lists, blockquote) and slash command menu
- **12 Field Types** — text, textarea, richtext, image, file, number, select, blocks, date, checkbox, switch, list
- **Multi-language (i18n)** — Per-field localization with locale selector in the editor, admin panel UI translations via `ui.json`

### Media Library

- Upload images and files with drag-and-drop
- Organize media into folders
- Track file references across content (which content uses which file)
- View storage statistics
- Cloudflare R2 integration with public URL serving

### Safety & Recovery

- **Soft Delete (Trash)** — Deleted content and media are moved to trash, not permanently removed
- **One-click Restore** — Recover any trashed item instantly
- **Local Drafts** — Unsaved changes are stored in localStorage and survive browser crashes
- **Unsaved Warnings** — Alerts before navigating away with pending changes
- **Discard Changes** — Revert to the last saved version at any time

### Authentication & Authorization

- **Better Auth** — Email OTP, GitHub OAuth, Google OAuth
- **Role-Based Access Control** — Owner, Admin, Editor system roles + custom roles
- **Fine-grained Permissions** — Global permissions (manage users, view monitor, manage media/trash) and per-collection permissions (view, create, edit, delete, publish)
- **User Invitations** — Invite users by email with a specific role, token-based acceptance
- **Ban System** — Ban/unban users with reason and optional expiration

### Monitoring & Audit

- **Audit Logs** — Every change tracked with user, action, entity, timestamp, and IP address
- **Activity Feed** — Unified timeline of content, media, and user changes
- **Dashboard** — Collection statistics, localization progress (donut chart), recent activity
- **Commit Timeline** — Visual chart of recent GitHub commits
- **System Health** — GitHub API rate limit status, repository size

### Security

- **CSRF Protection** — Origin header validation on all mutation requests
- **Rate Limiting** — 100 requests per minute per IP (auth routes excluded)
- **Security Headers** — HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, strict Referrer-Policy, Permissions-Policy (camera/microphone/geolocation disabled)
- **Environment Validation** — All environment variables validated with Zod at startup; missing or invalid values throw clear error messages

---

## Quick Start

### 1. Create a new project

```bash
npx create-statix-cms my-cms
cd my-cms
```

### 2. Set up required services

You need three services before starting (see [Prerequisites](#prerequisites) for step-by-step guides):

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [GitHub](https://github.com) | Content storage (JSON files) | Yes |
| [Turso](https://turso.tech) | User database (SQLite) | Yes |
| [Resend](https://resend.com) | Email OTP authentication | Yes (100 emails/day) |

Optional services:

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Cloudflare R2](https://www.cloudflare.com/r2/) | Media storage | Yes (10 GB) |
| GitHub OAuth | Social login | Yes |
| Google OAuth | Social login | Yes |

### 3. Configure environment

Fill in `.env` with your credentials (created automatically from `.env.example`). For a first local run you can leave most values empty — the app boots with safe defaults and prints warnings about what's missing. To exercise GitHub, Resend, R2, Turso end-to-end you'll need real values:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_OWNER=your-username
GITHUB_REPO=my-cms-content
BETTER_AUTH_SECRET=your-secret-here     # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
TURSO_DATABASE_URL=libsql://your-db.turso.io    # optional; falls back to ./local.db
TURSO_AUTH_TOKEN=your-turso-token
RESEND_API_KEY=re_xxxxxxxxxxxx                  # optional; OTP codes log to console when empty
RESEND_FROM_EMAIL=cms@yourdomain.com
INITIAL_ADMIN_EMAIL=your@email.com              # first user to promote to Owner
```

### 4. Start the dev server

The CLI ran `npm install` and `npm run db:push` for you already. Just start the dev server:

```bash
npm run dev
# or
bun run dev
```

### 5. Create your admin account

1. Open `http://localhost:3000/auth/signin`
2. Enter the email you set as `INITIAL_ADMIN_EMAIL` and sign in with the OTP (when Resend isn't configured, the code is printed to the dev server's terminal)
3. Promote that user to Owner:
   ```bash
   npm run seed:admin
   ```
4. Open `http://localhost:3000/admin` — you're now the Owner

> **Important:** The seed script promotes an **existing** user to Owner. You must sign in at least once first (step 2), then run the script. The CLI scaffolder prompts for `INITIAL_ADMIN_EMAIL` when running interactively, so this is usually already in your `.env`.

### 6. Configure your content

Edit `src/statix.config.ts` to define your collections and fields. See [Configuration](#configuration) for details.

---

## Prerequisites

### GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select the `repo` scope (full control of private repositories)
4. Copy the token → set as `GITHUB_TOKEN`

Create a **separate repository** for your content (can be public or private):

1. Go to [github.com/new](https://github.com/new)
2. Create an empty repository (no README needed)
3. Use the repo name as `GITHUB_REPO` and your username as `GITHUB_OWNER`

### Turso Database

1. Sign up at [turso.tech](https://turso.tech)
2. Install the CLI: `brew install tursodatabase/tap/turso` (or see [docs](https://docs.turso.tech/cli/installation))
3. Create a database:
   ```bash
   turso db create my-cms
   ```
4. Get the connection URL:
   ```bash
   turso db show my-cms --url
   # → libsql://my-cms-username.turso.io
   ```
5. Create an auth token:
   ```bash
   turso db tokens create my-cms
   ```
6. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`

### Resend (Email OTP)

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** → Create a new key
3. Set `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to your verified sender (e.g., `cms@yourdomain.com`)
5. (Optional) Verify your domain under **Domains** for better deliverability

### Cloudflare R2 (Optional — Media Storage)

1. Sign up at [cloudflare.com](https://www.cloudflare.com) and enable R2
2. Create a bucket (e.g., `my-cms-media`)
3. Go to **R2** → **Manage R2 API Tokens** → Create token with Object Read & Write
4. Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
5. Enable **Public Access** on the bucket and set `NEXT_PUBLIC_MEDIA_BASE_URL` to the public URL

### GitHub OAuth (Optional — Social Login)

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set the callback URL to: `{BETTER_AUTH_URL}/api/auth/callback/github`
4. Copy Client ID and Client Secret → set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### Google OAuth (Optional — Social Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorized redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`
4. Copy Client ID and Client Secret → set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

---

## Environment Variables

Variables are validated at startup with Zod. In **development**, missing values fall back to sensible defaults or get a printed warning — the app boots so you can explore the UI before configuring anything. In **production** the same variables are required and the app refuses to start without them.

| Variable | Dev | Production | Description |
|----------|-----|------------|-------------|
| `GITHUB_TOKEN` | Optional | **Required** | GitHub Personal Access Token with `repo` scope. Without it, content reads/writes return a clear error. |
| `GITHUB_OWNER` | Optional | **Required** | GitHub username or organization |
| `GITHUB_REPO` | Optional | **Required** | Repository name for content storage |
| `GITHUB_BRANCH` | Optional | Optional | Branch to use (default: `main`) |
| `BETTER_AUTH_SECRET` | Auto (unsafe) | **Required** | Auth secret — generate with `openssl rand -base64 32`. Dev uses an unsafe placeholder; the production guard refuses it. |
| `BETTER_AUTH_URL` | `http://localhost:3000` | **Required** | Full site URL |
| `TURSO_DATABASE_URL` | Optional | **Required** | Turso URL (`libsql://...turso.io`). When unset locally, drizzle uses `file:./local.db`. |
| `TURSO_AUTH_TOKEN` | Optional | **Required** | Turso authentication token |
| `RESEND_API_KEY` | Optional | **Required** | Resend API key. Without it, OTP codes are printed to the server console. |
| `RESEND_FROM_EMAIL` | Optional | **Required** | Sender email address (must be verified in Resend) |
| `GITHUB_CLIENT_ID` | Optional | Optional | GitHub OAuth app Client ID — button hidden when unset |
| `GITHUB_CLIENT_SECRET` | Optional | Optional | GitHub OAuth app Client Secret |
| `GOOGLE_CLIENT_ID` | Optional | Optional | Google OAuth Client ID — button hidden when unset |
| `GOOGLE_CLIENT_SECRET` | Optional | Optional | Google OAuth Client Secret |
| `R2_ACCOUNT_ID` | Optional | Optional | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Optional | Optional | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | Optional | Optional | R2 API token secret key |
| `R2_BUCKET_NAME` | Optional | Optional | R2 bucket name |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | Optional | **Required** | Public URL for R2 bucket (e.g., `https://pub-xxx.r2.dev`). Required in production for `next/image` + CSP. |
| `INITIAL_ADMIN_EMAIL` | Optional | Optional | Email to promote to Owner via `npm run seed:admin` |

---

## Configuration

All content modeling is done in `src/statix.config.ts`. This is the single source of truth for your CMS structure.

```ts
import { StatixConfig } from "@/statix/types";

export const statixConfig: StatixConfig = {
  github: {
    owner: process.env.GITHUB_OWNER || "",
    repo: process.env.GITHUB_REPO || "",
    branch: process.env.GITHUB_BRANCH || "main",
  },
  mediaFolder: "uploads",
  i18n: {
    locales: ["en", "tr"],
    defaultLocale: "en",
  },
  roles: [
    // Custom roles (see Roles & Permissions)
  ],
  collections: [
    // Your content types (see below)
  ],
};
```

### Defining Collections

There are two types of content:

**Singletons** — Single pages with unique content (e.g., Home, About, Contact):

```ts
{
  slug: "home",
  label: "Home Page",
  type: "singleton",
  path: "content/home",
  icon: "Home",
  fields: [
    { name: "title", label: "Page Title", type: "text", required: true, localized: true },
    { name: "heroImage", label: "Hero Image", type: "image" },
    { name: "ctaText", label: "Button Text", type: "text" },
  ],
}
```

**Collections** — Repeatable items (e.g., Blog Posts, Team Members):

```ts
{
  slug: "blog",
  label: "Blog Posts",
  path: "content/blog",
  icon: "FileText",
  titleField: "title",
  fields: [
    { name: "title", label: "Title", type: "text", required: true, localized: true },
    { name: "date", label: "Publish Date", type: "date", required: true },
    { name: "featuredImage", label: "Featured Image", type: "image" },
    { name: "content", label: "Content", type: "blocks", localized: true, blocks: [
      { type: "markdown", label: "Markdown", fields: [
        { name: "content", label: "Content", type: "textarea", rows: 10 },
      ]},
      { type: "image", label: "Image", fields: [
        { name: "image", label: "Image", type: "image", required: true },
        { name: "caption", label: "Caption", type: "text" },
      ]},
    ]},
  ],
}
```

### i18n Configuration

Define supported locales and the default:

```ts
i18n: {
  locales: ["en", "tr", "de", "fr"],
  defaultLocale: "en",
}
```

Fields with `localized: true` will show a locale selector in the editor. Admin panel UI translations are stored in `src/statix/content/ui.json`.

---

## Content Modeling

### Field Types

| Type | Description | Key Options |
|------|-------------|-------------|
| `text` | Single-line text input | `placeholder`, `localized` |
| `textarea` | Multi-line text input | `rows`, `placeholder`, `localized` |
| `richtext` | WYSIWYG rich text editor | `placeholder`, `localized` |
| `image` | Image picker (opens media library) | — |
| `file` | File upload | — |
| `number` | Numeric input | — |
| `select` | Dropdown selection | `options: [{ label, value }]` |
| `date` | Date picker | — |
| `checkbox` | Checkbox toggle | — |
| `switch` | Toggle switch | — |
| `list` | Repeatable group of fields | `fields: Field[]` |
| `blocks` | Drag-and-drop content blocks | `blocks: [{ type, label, fields }]` |

### List Fields (Repeatable Groups)

Use `list` for repeatable structured data like social links:

```ts
{
  name: "socialLinks",
  label: "Social Links",
  type: "list",
  fields: [
    { name: "platform", label: "Platform", type: "select", required: true,
      options: [
        { label: "Twitter / X", value: "twitter" },
        { label: "LinkedIn", value: "linkedin" },
        { label: "GitHub", value: "github" },
      ]
    },
    { name: "url", label: "URL", type: "text", required: true },
  ],
}
```

### Block Editor

Use `blocks` for flexible, composable content:

```ts
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
        { name: "content", label: "Content", type: "textarea", rows: 10 },
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

Blocks can be reordered via drag-and-drop in the editor.

---

## Roles & Permissions

### System Roles

| Role | Manage Users | View Monitor | Manage Media | Manage Trash | Content |
|------|:------------:|:------------:|:------------:|:------------:|:-------:|
| **Owner** | Yes | Yes | Yes | Yes | Full |
| **Admin** | Yes | Yes | Yes | Yes | Full |
| **Editor** | No | No | No | No | View, Create, Edit |

### Custom Roles

Define custom roles in `statix.config.ts` with granular permissions:

```ts
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
        "*": {                    // "*" applies to all collections
          canView: true,
          canCreate: false,
          canEdit: true,
          canDelete: false,
          canPublish: false,
        },
      },
    },
  },
],
```

### Permission Types

**Global Permissions:**
- `canManageUsers` — Create, edit, ban, invite users
- `canViewMonitor` — Access audit logs and system health
- `canManageMedia` — Upload, move, delete media files
- `canManageTrash` — View and manage soft-deleted items

**Collection Permissions (per collection or `*` for all):**
- `canView` — View collection items
- `canCreate` — Create new items
- `canEdit` — Edit existing items
- `canDelete` — Soft-delete items
- `canPublish` — Publish draft content

---

## Admin Panel

### Dashboard (`/admin`)

Overview of your CMS with collection statistics, localization progress (donut chart), and recent activity feed.

### Collections (`/admin/[collectionSlug]`)

List view for collection items with search, pagination, and status indicators. Click any item to open the editor.

### Content Editor (`/admin/[collectionSlug]/[id]`)

Field-based editing form with block editor, locale switching, and draft/publish workflow. Unsaved changes are preserved in localStorage.

### Media Library (`/admin/media`)

Upload, browse, organize, search, move, and delete media files. View storage statistics and track which content references each file.

### Users (`/admin/users`)

Create and invite users, assign roles with custom permissions, ban/unban users, and view per-user audit logs.

### Trash (`/admin/trash`)

Browse soft-deleted content and media. Restore items with one click or permanently delete them.

### Monitor (`/admin/monitor`)

Audit logs with filtering, activity charts by user and action type, commit timeline, and GitHub API rate limit status.

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (statix)/
│   │   ├── admin/                # Admin panel pages
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── [collectionSlug]/ # Collection list + editor
│   │   │   ├── media/            # Media library
│   │   │   ├── users/            # User management
│   │   │   ├── trash/            # Trash management
│   │   │   └── monitor/          # Audit & monitoring
│   │   ├── auth/                 # Sign-in, invite acceptance
│   │   └── api/                  # API routes (20 endpoints)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Public home page
│
├── statix/                       # CMS core library
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── editor/               # Rich text & block editor
│   │   ├── fields/               # Field type renderers
│   │   ├── collections/          # Collection list views
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── media/                # Media library UI
│   │   ├── users/                # User management UI
│   │   ├── trash/                # Trash UI
│   │   ├── monitor/              # Monitoring charts
│   │   ├── activity/             # Activity feed
│   │   ├── layout/               # Navigation, breadcrumbs
│   │   ├── shared/               # Reusable components
│   │   └── skeletons/            # Loading placeholders
│   ├── hooks/                    # 18 custom React hooks
│   ├── lib/                      # Core utilities
│   │   ├── github-cms.ts         # GitHub API integration
│   │   ├── r2.ts                 # Cloudflare R2 integration
│   │   ├── auth.ts               # Better Auth configuration
│   │   ├── session.ts            # Session & permission guards
│   │   ├── db.ts                 # Drizzle ORM client
│   │   ├── audit.ts              # Audit log writer
│   │   ├── rate-limit.ts         # Rate limiting
│   │   ├── env.ts                # Zod environment validation
│   │   └── ...                   # Content utils, dashboard data, etc.
│   ├── stores/                   # Zustand state stores
│   ├── types/                    # TypeScript type definitions
│   ├── db/                       # Drizzle ORM schema
│   └── content/                  # ui.json (admin panel translations)
│
├── statix.config.ts              # Content model configuration
├── middleware.ts                 # CSRF, rate limiting, auth guard
└── lib/
    └── utils.ts                  # General utilities
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `*` | `/api/auth/[...all]` | Better Auth handler (login, logout, OTP, OAuth callbacks) |

### Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/content/[collectionSlug]/[id]` | Get content item |
| `POST` | `/api/content/[collectionSlug]/[id]` | Create or update content |
| `DELETE` | `/api/delete/[collectionSlug]/[id]` | Soft-delete content |
| `GET` | `/api/collections/[slug]` | Get collection items list |

### Media (images)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload an image |
| `GET` | `/api/media/list` | List media files |
| `POST` | `/api/media/delete` | Soft-delete media |
| `POST` | `/api/media/move` | Move media between folders |
| `GET` | `/api/media/references` | Find content using a media file |
| `GET` | `/api/media/stats` | Storage statistics |
| `GET` | `/api/media/serve/[...path]` | Serve media files (public) |

### Files (documents)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/file` | Upload a non-image file (PDF, DOCX, ZIP, …) |
| `DELETE` | `/api/file` | Soft-delete a file by R2 key |
| `GET` | `/api/files/list` | Cursor-paginated list of files |
| `POST` | `/api/files/move` | Move a file between folders |
| `GET` | `/api/files/references` | Find content using a file |
| `GET` | `/api/files/stats` | File storage statistics |

### Trash

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/trash/list` | List soft-deleted items |
| `POST` | `/api/trash/restore` | Restore item from trash |
| `DELETE` | `/api/trash/delete` | Permanently delete item |
| `GET` | `/api/trash/media/[filename]` | Get trashed media metadata |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List users |
| `POST` | `/api/admin/users` | Create or update user (ban, role change, invite) |
| `POST` | `/api/admin/users/[id]/avatar` | Upload user avatar |
| `GET` | `/api/admin/activity` | Activity feed |
| `GET` | `/api/admin/audit` | Audit logs |
| `GET` | `/api/admin/search` | Cross-collection content search |

All API routes (except `/api/auth` and `/api/media/serve`) require authentication. Mutation requests are protected by CSRF validation and rate limiting (100 req/min per IP).

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.x |
| **UI** | React | 19.x |
| **Styling** | Tailwind CSS | 4.x |
| **Language** | TypeScript | 5.x |
| **Auth** | Better Auth | 1.x |
| **Database ORM** | Drizzle ORM | 0.45.x |
| **Database** | Turso (libsql) | — |
| **GitHub API** | Octokit | 5.x |
| **Object Storage** | AWS SDK S3 (Cloudflare R2) | 3.x |
| **State** | Zustand | 5.x |
| **Data Fetching** | TanStack React Query | 5.x |
| **Forms** | React Hook Form | 7.x |
| **Validation** | Zod | 4.x |
| **Rich Text** | ProseKit | 0.19.x |
| **Drag & Drop** | dnd-kit | 6.x |
| **Charts** | Recharts | 2.x |
| **Email** | Resend | 6.x |
| **Toasts** | Sonner | 2.x |
| **Icons** | Tabler Icons React | 3.x |
| **Components** | shadcn/ui + Base UI | — |

---

## Deployment

### Vercel (Recommended)

1. Push your project to GitHub
2. Import the repository in [Vercel Dashboard](https://vercel.com/new)
3. Set all [environment variables](#environment-variables)
4. Deploy

**Post-deploy checklist:**
- Update `BETTER_AUTH_URL` to your production domain
- Update OAuth callback URLs (GitHub, Google) to use production domain
- Generate a new `BETTER_AUTH_SECRET` for production

**Smart Deployments:** The included `vercel.json` has an ignore command that skips rebuilds when only content files change (content is stored in a separate GitHub repo, not in the app repo).

### Other Platforms

Statix CMS works on any platform that supports Next.js:

- [Netlify](https://netlify.com)
- [Railway](https://railway.app)
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
- Self-hosted with `npm run build && npm start`

### Production Checklist

- [ ] All required environment variables are set
- [ ] `BETTER_AUTH_SECRET` generated fresh for production
- [ ] `BETTER_AUTH_URL` set to production domain
- [ ] OAuth callback URLs updated to production domain
- [ ] Turso database created for production
- [ ] R2 bucket configured with public access (if using media)
- [ ] First admin user seeded via `npm run seed:admin`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run test` | Run the vitest suite once |
| `npm run test:watch` | Watch mode for tests |
| `npm run test:coverage` | Generate coverage report |
| `npm run db:push` | Push the drizzle schema to the database (libsql/Turso) |
| `npm run db:setup` | Run `db:push` then `seed:admin` — first-run database bootstrap |
| `npm run seed:admin` | Promote `INITIAL_ADMIN_EMAIL` to Owner role |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [gokerlek](https://github.com/gokerlek)

---

[Buy me a coffee](https://buymeacoffee.com/gokerlek)
