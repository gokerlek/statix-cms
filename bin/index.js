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

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
      // Skip node_modules and .next
      if (file === "node_modules" || file === ".next") continue;
      copyRecursive(path.join(src, file), path.join(dest, file));
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

  // Copy template files
  logStep("2/5", "Copying template files...");
  const templateDir = path.join(__dirname, "..", "template");
  copyRecursive(templateDir, targetDir);

  // Create .env from .env.example
  logStep("3/5", "Creating .env file...");
  const envExamplePath = path.join(targetDir, ".env.example");
  const envPath = path.join(targetDir, ".env");

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
  }

  // Update package.json with project name
  logStep("4/5", "Updating package.json...");
  const packageJsonPath = path.join(targetDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.name = projectName;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  // Install dependencies
  logStep("5/5", "Installing dependencies... (this may take a moment)");
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

  // Success message
  log("\n✅ Statix CMS project created successfully!\n", colors.green);
  log("Next steps:", colors.bright);
  console.log(`
  1. cd ${projectName}
  2. Edit ${colors.cyan}src/statix.config.ts${colors.reset} to configure your collections
  3. Fill in ${colors.cyan}.env${colors.reset} with your GitHub credentials
  4. Run ${colors.cyan}npm run dev${colors.reset} or ${colors.cyan}bun run dev${colors.reset}

For more information, visit:
  ${colors.cyan}https://github.com/gokerlek/statix-cms${colors.reset}
`);
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, colors.red);
  process.exit(1);
});
