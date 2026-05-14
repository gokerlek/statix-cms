import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";
import { sanitizeFilename } from "@/statix/lib/file-validation";

describe("smoke", () => {
  describe("cn (className merge)", () => {
    it("merges class names correctly", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("dedupes tailwind conflicts via tailwind-merge", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
    });
  });

  describe("sanitizeFilename", () => {
    it("keeps safe alphanumeric filenames", () => {
      expect(sanitizeFilename("hello-world.jpg")).toBe("hello-world.jpg");
    });

    it("strips leading/trailing dots", () => {
      expect(sanitizeFilename(".hidden")).not.toMatch(/^\.+/);
    });

    it("rejects path separators", () => {
      const result = sanitizeFilename("evil/../../etc/passwd");
      expect(result).not.toContain("/");
      expect(result).not.toContain("..");
    });
  });
});
