import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks: vi.mock runs before the imports below, so the mock factories
// must be self-contained.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

const getFileMock = vi.fn();
const getCollectionMock = vi.fn();

vi.mock("@/statix/lib/github-cms", () => ({
  getGitHubCMS: () => ({
    getFile: getFileMock,
    getCollection: getCollectionMock,
  }),
}));

vi.mock("@/statix.config", () => ({
  statixConfig: {
    github: { owner: "o", repo: "r", branch: "main" },
    collections: [
      { slug: "blog", path: "content/blog", type: "collection" },
      { slug: "empty", path: "content/empty", type: "collection" },
    ],
  },
}));

import { checkSlugAvailable } from "@/statix/lib/slug-index";

describe("checkSlugAvailable", () => {
  beforeEach(() => {
    getFileMock.mockReset();
    getCollectionMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 'unique' for an unknown collection", async () => {
    const result = await checkSlugAvailable("nope", "hello", null);
    expect(result).toBe("unique");
  });

  it("returns 'unique' when the slug is absent from the set", async () => {
    getCollectionMock.mockResolvedValue([
      { name: "a.json", path: "content/blog/a.json" },
    ]);
    getFileMock.mockResolvedValue({
      content: { slug: "something-else" },
      sha: "1",
    });

    const result = await checkSlugAvailable("blog", "hello", null);
    expect(result).toBe("unique");
  });

  it("returns 'duplicate' when a new item collides with an existing slug", async () => {
    getCollectionMock.mockResolvedValue([
      { name: "a.json", path: "content/blog/a.json" },
    ]);
    getFileMock.mockResolvedValue({
      content: { slug: "hello" },
      sha: "1",
    });

    const result = await checkSlugAvailable("blog", "hello", null);
    expect(result).toBe("duplicate");
  });

  it("returns 'unique' when the colliding slug belongs to the item being edited", async () => {
    getCollectionMock.mockResolvedValue([
      { name: "a.json", path: "content/blog/a.json" },
    ]);
    getFileMock.mockResolvedValue({
      content: { slug: "hello" },
      sha: "1",
    });

    const result = await checkSlugAvailable("blog", "hello", "existing-item");
    expect(result).toBe("unique");
  });

  it("returns 'unique' for an empty slug input", async () => {
    const result = await checkSlugAvailable("blog", "", null);
    expect(result).toBe("unique");
    expect(getCollectionMock).not.toHaveBeenCalled();
  });

  it("tolerates a broken file in the collection (Promise.allSettled)", async () => {
    getCollectionMock.mockResolvedValue([
      { name: "a.json", path: "content/blog/a.json" },
      { name: "b.json", path: "content/blog/b.json" },
    ]);
    getFileMock
      .mockResolvedValueOnce({ content: { slug: "alpha" }, sha: "1" })
      .mockRejectedValueOnce(new Error("fetch failed"));

    const result = await checkSlugAvailable("blog", "alpha", null);
    expect(result).toBe("duplicate");
  });

  it("returns 'unchecked' when the collection exceeds the scan limit", async () => {
    const many = Array.from({ length: 300 }, (_, i) => ({
      name: `${i}.json`,
      path: `content/blog/${i}.json`,
    }));
    getCollectionMock.mockResolvedValue(many);

    const result = await checkSlugAvailable("blog", "hello", null);
    expect(result).toBe("unchecked");
    // We short-circuit before fetching any file.
    expect(getFileMock).not.toHaveBeenCalled();
  });
});
