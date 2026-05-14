#!/usr/bin/env node

const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

// Dotfiles can lose their leading dot or be treated as hidden by some
// tooling when shipped inside an npm tarball. We ship `.github` as
// `_github` and restore the dot at scaffold time. Only top-level
// directories under template/ are considered — nested files keep their
// names verbatim.
const TOP_LEVEL_RENAMES = {
  _github: ".github",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

// A single readline interface reused across the wizard — opening / closing
// one per question feels janky and breaks paste support on some terminals.
function createPrompter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return {
    ask: (question) =>
      new Promise((resolve) => rl.question(question, (a) => resolve(a.trim()))),
    close: () => rl.close(),
  };
}

function q(label, hint) {
  // Indented label with cyan `?` and an optional gray hint.
  const tail = hint ? ` ${colors.gray}${hint}${colors.reset}` : "";
  return `  ${colors.cyan}?${colors.reset} ${label}${tail}: `;
}

async function getProjectName(prompter) {
  let projectName = process.argv[2];

  if (!projectName) {
    log("\n📦 Statix CMS — Git-based Headless CMS\n", colors.bright);
    projectName = await prompter.ask(q("Project name", "[my-statix-cms]"));
    if (!projectName) {
      projectName = "my-statix-cms";
      log(`  ${colors.dim}Using default: ${projectName}${colors.reset}`);
    }
  }

  return projectName;
}

/**
 * Interactive setup wizard. Returns an object of env keys → values that
 * the user provided. Missing keys are left empty in .env so the app can
 * still boot (env.ts has dev fallbacks for everything required).
 *
 * Non-interactive shells skip the wizard entirely — useful for CI /
 * provisioning where input is unavailable.
 */
async function runSetupWizard(prompter) {
  if (!process.stdin.isTTY) {
    log(
      "\n⏩ Non-interactive shell detected — skipping setup wizard.",
      colors.yellow,
    );
    log("   Edit .env manually after scaffolding.\n", colors.yellow);
    return {};
  }

  log(
    "\n┌─ Setup wizard ──────────────────────────────────────────────┐",
    colors.bright,
  );
  log(
    "│  Press Enter to skip any optional field. You can fill .env  │",
    colors.gray,
  );
  log(
    "│  in later for sections you skip.                            │",
    colors.gray,
  );
  log(
    "└─────────────────────────────────────────────────────────────┘",
    colors.bright,
  );

  const config = {};

  // --- Authentication (required to sign in at all) -------------------------
  log("\nAuthentication", colors.bright);
  config.INITIAL_ADMIN_EMAIL = await prompter.ask(
    q("First admin email", "you'll sign in with this"),
  );
  config.BETTER_AUTH_SECRET = crypto.randomBytes(32).toString("base64");
  log(
    `    ${colors.green}✓${colors.reset} ${colors.dim}Generated BETTER_AUTH_SECRET${colors.reset}`,
  );
  const url = await prompter.ask(q("App URL", "[http://localhost:3000]"));
  config.BETTER_AUTH_URL = url || "http://localhost:3000";

  // --- GitHub (content storage) --------------------------------------------
  log("\nGitHub — content storage", colors.bright);
  log(
    `  ${colors.dim}Your content (JSON files) lives in a GitHub repo. Skip to wire this up later.${colors.reset}`,
  );
  const githubToken = await prompter.ask(
    q("GitHub token (ghp_…)", "[skip]"),
  );
  if (githubToken) {
    config.GITHUB_TOKEN = githubToken;
    config.GITHUB_OWNER = await prompter.ask(q("GitHub owner / org"));
    config.GITHUB_REPO = await prompter.ask(q("GitHub repo name"));
    const branch = await prompter.ask(q("Branch", "[main]"));
    config.GITHUB_BRANCH = branch || "main";
  }

  // --- Resend (OTP email) --------------------------------------------------
  log("\nResend — OTP email", colors.bright);
  log(
    `  ${colors.dim}Optional in dev — when empty, OTP codes are printed to the server console.${colors.reset}`,
  );
  const resendKey = await prompter.ask(q("Resend API key (re_…)", "[skip]"));
  if (resendKey) {
    config.RESEND_API_KEY = resendKey;
    config.RESEND_FROM_EMAIL = await prompter.ask(
      q("From address", "cms@yourdomain.com"),
    );
  }

  // --- Cloudflare R2 (media storage) ---------------------------------------
  log("\nCloudflare R2 — media storage", colors.bright);
  log(
    `  ${colors.dim}Optional. Without R2, media uploads return 503. Set up later in .env if needed.${colors.reset}`,
  );
  const r2Account = await prompter.ask(q("R2 Account ID", "[skip]"));
  if (r2Account) {
    config.R2_ACCOUNT_ID = r2Account;
    config.R2_ACCESS_KEY_ID = await prompter.ask(q("R2 Access Key ID"));
    config.R2_SECRET_ACCESS_KEY = await prompter.ask(q("R2 Secret Access Key"));
    config.R2_BUCKET_NAME = await prompter.ask(q("R2 Bucket name"));
    config.NEXT_PUBLIC_MEDIA_BASE_URL = await prompter.ask(
      q("Public media URL", "https://pub-…r2.dev"),
    );
  }

  log("");
  return config;
}

/**
 * Write `.env` based on `.env.example` as a template, replacing values
 * the wizard collected. Keys not in `config` keep the example's value
 * (which is empty — env.ts handles those gracefully).
 */
function writeEnvFromConfig(envExamplePath, envPath, config) {
  const template = fs.readFileSync(envExamplePath, "utf-8");
  const lines = template.split("\n").map((line) => {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=/);
    if (!match) return line; // comment or blank, leave as-is
    const key = match[1];
    if (Object.prototype.hasOwnProperty.call(config, key) && config[key]) {
      return `${key}=${config[key]}`;
    }
    return line;
  });
  fs.writeFileSync(envPath, lines.join("\n"));
}

function copyRecursive(src, dest, isRoot = false) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
      // Skip maintainer dev artifacts
      if (file === "node_modules" || file === ".next") continue;
      // Maintainer's Claude / OMC workspaces — internal only, don't ship
      if (isRoot && (file === ".claude" || file === ".omc")) continue;
      // Maintainer's local sqlite — scaffolded projects start with an
      // empty DB created by `npm run db:setup`.
      if (isRoot && (file === "local.db" || file === "local.db-journal")) {
        continue;
      }
      // CRITICAL: never copy real env values out of the maintainer's
      // template/. The `.npmignore` is the primary defense — this is a
      // second line for when running bin/index.js out of a working tree
      // (e.g. local dev/test). .env.example is allowed; everything else
      // is treated as a real credential file.
      if (
        isRoot &&
        (file === ".env" ||
          file === ".env.local" ||
          file.startsWith(".env.") ||
          /^\.env\.[a-z]+$/.test(file)) &&
        file !== ".env.example"
      ) {
        continue;
      }
      // Restore dot-prefixed names at the top level (see TOP_LEVEL_RENAMES).
      const destName =
        isRoot && TOP_LEVEL_RENAMES[file] ? TOP_LEVEL_RENAMES[file] : file;
      copyRecursive(path.join(src, file), path.join(dest, destName), false);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  const prompter = createPrompter();

  try {
    const projectName = await getProjectName(prompter);

    if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
      log(
        "\n❌ Project name can only contain letters, numbers, hyphens, and underscores.",
        colors.red,
      );
      process.exit(1);
    }

    const targetDir = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
      log(`\n❌ Directory "${projectName}" already exists.`, colors.red);
      process.exit(1);
    }

    // Gather all env config BEFORE writing anything — fail fast on Ctrl+C
    // without leaving a half-scaffolded directory behind.
    const envConfig = await runSetupWizard(prompter);

    log("\n🚀 Creating Statix CMS project...\n", colors.bright);

    logStep("1/6", "Creating project directory…");
    fs.mkdirSync(targetDir, { recursive: true });

    logStep("2/6", "Copying template files…");
    const templateDir = path.join(__dirname, "..", "template");
    copyRecursive(templateDir, targetDir, true);

    logStep("3/6", "Writing .env…");
    const envExamplePath = path.join(targetDir, ".env.example");
    const envPath = path.join(targetDir, ".env");
    if (fs.existsSync(envExamplePath)) {
      writeEnvFromConfig(envExamplePath, envPath, envConfig);
    }

    logStep("4/6", "Updating package.json + README…");
    const packageJsonPath = path.join(targetDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      packageJson.name = projectName;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    const readmePath = path.join(targetDir, "README.md");
    fs.writeFileSync(
      readmePath,
      `# ${projectName}

A Statix CMS project — a Git-based headless CMS built on Next.js, Better Auth,
and Cloudflare R2. Your content lives in a GitHub repo; this app is the
admin panel.

## Quick start

1. Verify your \`.env\` — the setup wizard prefilled what you provided.
   Sections you skipped (GitHub, Resend, R2) can be filled in later.
2. Initialise the database (creates tables and promotes \`INITIAL_ADMIN_EMAIL\`
   to Owner):
   \`\`\`bash
   npm run db:setup
   \`\`\`
3. Start the dev server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open <http://localhost:3000/auth/signin> and sign in with the admin email.

## Customisation

- \`src/statix.config.ts\` — declare your content collections
- \`src/statix/content/ui.json\` — every UI string (no hardcoded copy in components)
- \`src/statix/components/\` — fully owned components, edit freely

## Upstream

Statix CMS upstream: <https://github.com/gokerlek/statix-cms>
`,
    );

    logStep("5/6", "Installing dependencies… (this may take a moment)");
    try {
      try {
        execSync("bun --version", { stdio: "ignore" });
        execSync("bun install", { cwd: targetDir, stdio: "inherit" });
      } catch {
        execSync("npm install", { cwd: targetDir, stdio: "inherit" });
      }
    } catch {
      log(
        "\n⚠️  Failed to install dependencies. Please run 'npm install' manually.",
        colors.yellow,
      );
    }

    logStep("6/6", "Setting up database…");
    try {
      execSync("npm run db:push", { cwd: targetDir, stdio: "inherit" });
    } catch {
      log(
        "\n⚠️  db:push failed. Configure DB credentials in .env then run: npm run db:setup",
        colors.yellow,
      );
    }

    log("\n✅ Statix CMS project created successfully!\n", colors.green);
    log("Next steps:", colors.bright);
    console.log(`
  1. cd ${projectName}
  2. ${colors.cyan}npm run seed:admin${colors.reset}   ${colors.dim}# promote INITIAL_ADMIN_EMAIL to Owner${colors.reset}
  3. ${colors.cyan}npm run dev${colors.reset}          ${colors.dim}# http://localhost:3000${colors.reset}
  4. Visit /auth/signin and sign in with your admin email

Docs: ${colors.cyan}https://github.com/gokerlek/statix-cms${colors.reset}
`);
  } finally {
    prompter.close();
  }
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, colors.red);
  process.exit(1);
});
