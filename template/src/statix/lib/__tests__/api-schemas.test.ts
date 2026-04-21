import { describe, expect, it, vi } from "vitest";

vi.mock("@/statix/lib/env", () => ({
  env: { TRUSTED_PROXY_COUNT: 1 },
}));

import { r2Key, safePath, storageFilename } from "@/statix/lib/api-schemas";

describe("safePath", () => {
  it.each<string>([
    "uploads/blog/hero.jpg",
    "uploads/blog/çağrı.jpg",
    "files/doc.pdf",
    "avatars/user.png",
    "trash/old.jpg",
    "uploads/blog/file%20name.jpg",
  ])("accepts legit path: %s", (input) => {
    const res = safePath.safeParse(input);
    expect(res.success).toBe(true);
  });

  it("normalizes leading slashes (legacy content compat)", () => {
    const res = safePath.safeParse("/uploads/legacy.jpg");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe("uploads/legacy.jpg");
    }
  });

  it("strips `public/` legacy prefix", () => {
    const res = safePath.safeParse("public/uploads/old.jpg");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe("uploads/old.jpg");
    }
  });

  it.each<string>([
    "..",
    "../etc/passwd",
    "uploads/..%2F..%2Fsecret",
    "%2e%2e/etc/passwd",
    "uploads//double//slash",
    "uploads\\windows\\backslash",
    "uploads/\0nullbyte",
    "uploads/%ZZmalformed",
    "uploads/%",
  ])("rejects malicious: %s", (input) => {
    const res = safePath.safeParse(input);
    expect(res.success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(safePath.safeParse("").success).toBe(false);
  });

  it("rejects after normalize-empty input (only slashes)", () => {
    expect(safePath.safeParse("////").success).toBe(false);
  });

  it("rejects overlong paths", () => {
    expect(safePath.safeParse("a".repeat(1024)).success).toBe(false);
  });
});

describe("r2Key", () => {
  it.each(["uploads/", "avatars/", "trash/", "files/"])(
    "accepts all four storage prefixes: %s…",
    (prefix) => {
      expect(r2Key.safeParse(`${prefix}foo.png`).success).toBe(true);
    },
  );

  it("rejects unknown prefix", () => {
    expect(r2Key.safeParse("exports/foo.csv").success).toBe(false);
  });
});

describe("storageFilename", () => {
  it.each(["hero.jpg", "my-file_v2.png", "document.pdf", "a.b.c"])(
    "accepts safe filename: %s",
    (name) => {
      expect(storageFilename.safeParse(name).success).toBe(true);
    },
  );

  it.each([
    "..",
    "..evil",
    "ev..il.jpg",
    "trailing.",
    ".leading",
    "file/with/slash.jpg",
    "file\\with\\back.jpg",
    "",
    "a".repeat(200),
  ])("rejects bad filename: %s", (name) => {
    expect(storageFilename.safeParse(name).success).toBe(false);
  });
});
