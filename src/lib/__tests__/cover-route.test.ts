import { describe, it, expect, jest, beforeEach, afterAll } from "@jest/globals";

const findFirstPiece = jest.fn<() => Promise<{ coverImage: string | null } | null>>();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    piece: { findFirst: () => findFirstPiece() },
    series: { findFirst: () => Promise.resolve(null) },
  },
}));

// Loaded with `require` rather than a top-level import so the prisma mock above
// is unambiguously in place before the route module resolves it.
const { GET } = require("@/app/api/cover/[owner]/[slug]/route") as typeof import("@/app/api/cover/[owner]/[slug]/route");

const REQUEST_URL = "https://thoughts-whatever.vercel.app/api/cover/piece/abc";
const REMOTE = "https://res.cloudinary.com/demo/image/upload/a.webp";

// 1x1 transparent PNG
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF/AAAAAABJRU5ErkJggg==";

const realFetch = globalThis.fetch;
const fetchMock = jest.fn<typeof fetch>();

function get(params = { owner: "piece", slug: "abc" }) {
  return GET(new Request(REQUEST_URL), { params });
}

beforeEach(() => {
  findFirstPiece.mockReset();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

const IMMUTABLE = "public, max-age=31536000, s-maxage=31536000, immutable";

describe("GET /api/cover/[owner]/[slug]", () => {
  it("serves a stored data URI as bytes, cached for a year", async () => {
    findFirstPiece.mockResolvedValue({ coverImage: `data:image/png;base64,${PNG_B64}` });

    const res = await get();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toBe(IMMUTABLE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("404s a missing cover with a short cache, never a year", async () => {
    findFirstPiece.mockResolvedValue({ coverImage: null });

    const res = await get();

    expect(res.status).toBe(404);
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  });

  /**
   * The regression this whole branch turns on. `next/image` resolves a
   * `/`-prefixed src in-process and reads the mocked response's buffers — it
   * never follows `Location`, so a 307 here reaches the optimizer as a
   * zero-length body and fails every cover on the site. Asserting on the
   * status and the bytes, not just the absence of a `Location` header, is
   * deliberate: a future change back to a redirect must fail this test.
   */
  it("proxies a migrated cover's bytes rather than redirecting to it", async () => {
    findFirstPiece.mockResolvedValue({ coverImage: REMOTE });
    fetchMock.mockResolvedValue(
      new Response(Buffer.from(PNG_B64, "base64"), {
        headers: { "Content-Type": "image/webp" },
      }),
    );

    const res = await get();

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(res.headers.get("cache-control")).toBe(IMMUTABLE);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");

    const body = Buffer.from(await res.arrayBuffer());
    expect(body.subarray(1, 4).toString("ascii")).toBe("PNG");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]![0])).toBe(REMOTE);
  });

  it("502s a failing upstream with a 30s cache, so one bad fetch is not permanent", async () => {
    findFirstPiece.mockResolvedValue({ coverImage: REMOTE });
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));

    const res = await get();

    expect(res.status).toBe(502);
    expect(res.headers.get("cache-control")).toBe("public, max-age=30");
  });

  it("502s an upstream 200 that is not an image", async () => {
    findFirstPiece.mockResolvedValue({ coverImage: REMOTE });
    fetchMock.mockResolvedValue(
      new Response("<html>error page</html>", { headers: { "Content-Type": "text/html" } }),
    );

    const res = await get();

    expect(res.status).toBe(502);
  });

  it("502s when the upstream fetch throws or times out", async () => {
    findFirstPiece.mockResolvedValue({ coverImage: REMOTE });
    fetchMock.mockRejectedValue(new Error("TimeoutError"));

    const res = await get();

    expect(res.status).toBe(502);
  });

  it("never fetches a host outside the image allowlist", async () => {
    findFirstPiece.mockResolvedValue({ coverImage: "https://evil.example.com/x.jpg" });

    const res = await get();

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
