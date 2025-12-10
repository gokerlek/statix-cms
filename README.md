# create-statix-cms

Create a new Statix CMS project with a single command.

**Statix CMS** is a modern, Git-based headless CMS built with Next.js 15, React 19, and Tailwind CSS 4. It uses GitHub as the database and features a powerful content editor.

## Quick Start

```bash
npx create-statix-cms my-project
cd my-project
```

Then:
1. Edit `src/statix.config.ts` to configure your collections
2. Fill in `.env` with your GitHub credentials
3. Run `npm run dev` or `bun run dev`

## Features

- 🔐 **Authentication**: NextAuth.js v5 with GitHub OAuth
- 📝 **Block Editor**: Drag-and-drop content blocks
- 🎨 **Modern UI**: Beautiful admin interface with Tailwind CSS 4
- 📦 **GitHub Storage**: All content stored as JSON files
- 🖼️ **Image Uploads**: Direct image uploads to GitHub
- 📱 **Responsive**: Works on all devices

## Documentation

For full documentation, see the [README](./template/README.md) in the generated project.

## License

MIT
