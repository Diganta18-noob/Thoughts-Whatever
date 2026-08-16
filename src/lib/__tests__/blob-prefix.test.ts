import { describe, it, expect, jest } from "@jest/globals";

// The module under test imports the Prisma client for its raw query. Mocked so
// importing it here never instantiates a real client.
jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import { usablePrefix, BLOB_PREFIX } from "@/lib/blob-prefix";

describe("usablePrefix", () => {
  it("passes a short value through untouched", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/a.webp";
    expect(usablePrefix(url)).toBe(url);
  });

  it("treats a missing value as absent", () => {
    expect(usablePrefix(undefined)).toBeNull();
    expect(usablePrefix("")).toBeNull();
  });

  /**
   * The guard this function exists for. `left(col, 512)` cuts at an arbitrary
   * character, so a URL that fills the budget may be missing its tail — and half
   * a URL is a broken image, published as though it were real. Callers fall back
   * to the `/api/cover` path instead, which is always correct.
   */
  it("refuses a value that fills the budget, because it may be cut mid-URL", () => {
    expect(usablePrefix("https://x.example/" + "a".repeat(BLOB_PREFIX))).toBeNull();
    expect(usablePrefix("a".repeat(BLOB_PREFIX - 1))).not.toBeNull();
  });

  /**
   * A data URI is exempt: nothing downstream reads past its declared mime — the
   * feed pulls `image/webp` out of the leading bytes, the article page discards
   * it outright — so a truncated one is not a broken value, it is the whole
   * point of asking for a prefix.
   */
  it("keeps a truncated data URI, which is only ever read for its mime", () => {
    const cut = "data:image/webp;base64," + "A".repeat(BLOB_PREFIX);
    expect(usablePrefix(cut)).toBe(cut);
  });

  it("honours a caller-supplied budget", () => {
    expect(usablePrefix("abcdef", 6)).toBeNull();
    expect(usablePrefix("abcde", 6)).toBe("abcde");
  });
});
