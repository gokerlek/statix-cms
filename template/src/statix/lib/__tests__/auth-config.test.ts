import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { nextCookies } from "better-auth/next-js";

const AUTH_SOURCE = resolve(__dirname, "../auth.ts");

/**
 * Regression guards for the better-auth plugin list.
 *
 * We can't import `./auth` directly in unit tests because it eagerly
 * constructs a Resend client, a drizzle adapter, and validates env vars
 * — all of which fail without a real .env. Instead we exercise the
 * plugin constructor in isolation and verify the source file lists it
 * in the right slot.
 */
describe("auth.ts plugin configuration", () => {
  it("nextCookies() returns a plugin with id 'next-cookies'", () => {
    // Sanity check: the plugin id the source-level test below relies on.
    const plugin = nextCookies();
    expect(plugin.id).toBe("next-cookies");
  });

  it("imports nextCookies from better-auth/next-js", () => {
    const source = readFileSync(AUTH_SOURCE, "utf8");
    expect(source).toMatch(
      /import\s*\{\s*nextCookies\s*\}\s*from\s*["']better-auth\/next-js["']/,
    );
  });

  it("registers nextCookies() as the LAST plugin", () => {
    const source = readFileSync(AUTH_SOURCE, "utf8");

    // Extract the plugins array literal. We tolerate whitespace and comments
    // inside it.
    const match = source.match(/plugins:\s*\[([\s\S]*?)\n\s*\],/);
    expect(match, "auth.ts must declare a `plugins: [ ... ],` array").not.toBeNull();

    const body = match![1];

    // The plugin entries (excluding line/block comments) ordered by position.
    // We strip comments first, then split on `),\n` to isolate factory calls.
    const stripped = body
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");

    // Find each top-level invocation by matching `<name>(` at depth 0.
    const calls: string[] = [];
    let depth = 0;
    let start = -1;
    let nameStart = -1;
    for (let i = 0; i < stripped.length; i++) {
      const c = stripped[i];
      if (depth === 0 && /[A-Za-z_]/.test(c) && nameStart < 0) {
        nameStart = i;
      }
      if (c === "(") {
        if (depth === 0 && nameStart >= 0) {
          start = nameStart;
        }
        depth++;
      } else if (c === ")") {
        depth--;
        if (depth === 0 && start >= 0) {
          calls.push(stripped.slice(start, i + 1));
          start = -1;
          nameStart = -1;
        }
      } else if (depth === 0 && /[,\s]/.test(c)) {
        nameStart = -1;
      }
    }

    expect(calls.length).toBeGreaterThan(0);

    const last = calls[calls.length - 1];
    expect(last).toMatch(/^nextCookies\(/);
  });
});
