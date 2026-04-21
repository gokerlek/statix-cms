import { describe, expect, it } from "vitest";

import { slugify } from "@/statix/lib/utils";

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("expands `&` to 'and'", () => {
    expect(slugify("Rock & Roll")).toBe("rock-and-roll");
  });

  it("strips punctuation", () => {
    expect(slugify("What?! Is this, really…")).toBe("what-is-this-really");
  });

  it("collapses consecutive hyphens and whitespace", () => {
    // underscores are part of `\w` so they pass through; only whitespace +
    // punctuation collapse into single `-`.
    expect(slugify("a   b___c---d")).toBe("a-b___c-d");
  });

  it("trims leading/trailing separators", () => {
    expect(slugify("  --hello--  ")).toBe("hello");
  });

  it("removes diacritics from Latin characters", () => {
    expect(slugify("café")).toBe("cafe");
    expect(slugify("naïve")).toBe("naive");
    expect(slugify("résumé")).toBe("resume");
  });

  it("normalizes Turkish letters so case variants collapse", () => {
    // The collision check in Faz 5c relies on this: "Türkiye" and "türkiye"
    // must produce the same slug.
    expect(slugify("Türkiye")).toBe("turkiye");
    expect(slugify("türkiye")).toBe("turkiye");
    expect(slugify("TÜRKİYE")).toBe("turkiye");
  });

  it("handles Turkish-specific letters", () => {
    expect(slugify("İstanbul")).toBe("istanbul");
    expect(slugify("ĞÜŞÇÖİ")).toBe("guscoi");
  });

  it("caps the output at 96 characters", () => {
    const long = "a".repeat(200);
    expect(slugify(long).length).toBeLessThanOrEqual(96);
  });

  it("returns an empty string for input with no slug-able content", () => {
    expect(slugify("   ")).toBe("");
    expect(slugify("!@#$%^&*()")).not.toContain("@");
  });

  it("keeps alphanumerics as-is", () => {
    expect(slugify("post-123")).toBe("post-123");
  });
});
