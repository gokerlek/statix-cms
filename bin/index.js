#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

// Dotfiles cannot live as `.github` / `.husky` inside the published npm
// tarball without losing their leading dot or being treated as hidden by
// some tooling; we ship them as `_github` / `_husky` and restore the dot
// at scaffold time. Only top-level directories under template/ are
// considered — nested files keep their names verbatim.
const TOP_LEVEL_RENAMES = {
  _github: ".github",
  _husky: ".husky",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getProjectName() {
  let projectName = process.argv[2];

  if (!projectName) {
    log("\n📦 Statix CMS - Git-based Headless CMS\n", colors.bright);
    projectName = await prompt(`${colors.cyan}?${colors.reset} Project name: `);

    if (!projectName) {
      projectName = "my-statix-cms";
      log(`  Using default: ${projectName}`, colors.yellow);
    }
  }

  return projectName;
}

function copyRecursive(src, dest, isRoot = false) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
      // Skip maintainer dev artifacts
      if (file === "node_modules" || file === ".next") continue;
      // Maintainer's local sqlite — scaffolded projects start with an
      // empty DB created by `npm run db:setup`.
      if (isRoot && (file === "local.db" || file === "local.db-journal")) {
        continue;
      }
      // Restore dot-prefixed names at the top level (see TOP_LEVEL_RENAMES).
      const destName =
        isRoot && TOP_LEVEL_RENAMES[file]
          ? TOP_LEVEL_RENAMES[file]
          : file;
      copyRecursive(path.join(src, file), path.join(dest, destName), false);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  const projectName = await getProjectName();

  // Validate project name
  if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
    log(
      "\n❌ Project name can only contain letters, numbers, hyphens, and underscores.",
      colors.red
    );
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  // Check if directory already exists
  if (fs.existsSync(targetDir)) {
    log(`\n❌ Directory "${projectName}" already exists.`, colors.red);
    process.exit(1);
  }

  log("\n🚀 Creating Statix CMS project...\n", colors.bright);

  // Create target directory
  logStep("1/5", "Creating project directory...");
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy template files (with top-level _github/_husky rename and local.db skip)
  logStep("2/6", "Copying template files...");
  const templateDir = path.join(__dirname, "..", "template");
  copyRecursive(templateDir, targetDir, true);

  // Create .env from .env.example
  logStep("3/6", "Creating .env file...");
  const envExamplePath = path.join(targetDir, ".env.example");
  const envPath = path.join(targetDir, ".env");

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
  }

  // Update package.json with project name
  logStep("4/6", "Updating package.json...");
  const packageJsonPath = path.join(targetDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.name = projectName;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  // Optional: prompt for INITIAL_ADMIN_EMAIL when running interactively.
  // Skipped when stdin is not a TTY (CI provisioning, Docker, < /dev/null)
  // — `seed:admin` will exit 1 with a clear message in that case.
  if (process.stdin.isTTY && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    if (!/^INITIAL_ADMIN_EMAIL=.+$/m.test(envContent)) {
      const adminEmail = await prompt(
        `${colors.cyan}?${colors.reset} First admin email (optional, for npm run seed:admin): `,
      );
      if (adminEmail) {
        const trimmed = envContent.replace(/\n*$/, "");
        fs.writeFileSync(
          envPath,
          `${trimmed}\nINITIAL_ADMIN_EMAIL=${adminEmail}\n`,
        );
      }
    }
  }

  // Install dependencies
  logStep("5/6", "Installing dependencies... (this may take a moment)");
  try {
    // Check if bun is available
    try {
      execSync("bun --version", { stdio: "ignore" });
      execSync("bun install", { cwd: targetDir, stdio: "inherit" });
    } catch {
      // Fall back to npm
      execSync("npm install", { cwd: targetDir, stdio: "inherit" });
    }
  } catch (error) {
    log(
      "\n⚠️  Failed to install dependencies. Please run 'npm install' manually.",
      colors.yellow
    );
  }

  // Initialise the database. With TURSO_DATABASE_URL empty (default after
  // scaffold) drizzle.config.ts falls back to file:./local.db so this works
  // out of the box. Non-fatal: the user may want to configure Turso first
  // and run db:setup themselves.
  logStep("6/6", "Setting up database...");
  try {
    execSync("npm run db:push", { cwd: targetDir, stdio: "inherit" });
  } catch {
    log(
      "\n⚠️  db:push failed. Configure DB credentials in .env then run: npm run db:setup",
      colors.yellow,
    );
  }

  // Success message
  log("\n✅ Statix CMS project created successfully!\n", colors.green);
  log("Next steps:", colors.bright);
  console.log(`
  1. cd ${projectName}
  2. Open ${colors.cyan}.env${colors.reset} and fill in:
       BETTER_AUTH_SECRET  (openssl rand -base64 32)
       BETTER_AUTH_URL     (e.g. http://localhost:3000)
       GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO  (content storage)
       RESEND_API_KEY, RESEND_FROM_EMAIL        (OTP email)
       INITIAL_ADMIN_EMAIL                      (first admin)
  3. ${colors.cyan}npm run db:setup${colors.reset}      # tables + promote admin
  4. ${colors.cyan}npm run dev${colors.reset}           # http://localhost:3000
  5. Visit /auth/signin and sign in with INITIAL_ADMIN_EMAIL

Docs: ${colors.cyan}https://github.com/gokerlek/statix-cms${colors.reset}
`);
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, colors.red);
  process.exit(1);
});
