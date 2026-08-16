import { describe, it, expect, jest, beforeEach, afterAll } from "@jest/globals";

// The route imports `PUBLISHED` from `@/lib/pieces`, which wraps its queries in
// React's `cache()` — an API the App Router polyfills but the installed react
// 18.3.1 does not export.
jest.mock("react", () => ({
  ...(jest.requireActual("react") as object),
  cache: <T,>(fn: T) => fn,
}));

type Args = { where?: unknown; select?: unknown };

const findFirstPiece = jest.fn<(args: Args) => Promise<{ coverImage: string | null } | null>>();
const findFirstSeries = jest.fn<
  (args: Args) => Promise<{ coverImage: string | null; pieces: { coverImage: string | null }[] } | null>
>();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    piece: { findFirst: (args: Args) => findFirstPiece(args) },
    series: { findFirst: (args: Args) => findFirstSeries(args) },
  },
}));

// Loaded with `require` rather than a top-level import so the mocks above are
// unambiguously in place before the route module resolves them.
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
  findFirstSeries.mockReset();
  findFirstSeries.mockResolvedValue(null);
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

  /**
   * A cover is public artwork for a *published* piece. Unfiltered, this endpoint
   * answered for drafts too, so guessing an unpublished slug returned its
   * artwork — under a year-long `immutable`, so it kept being served even after
   * the piece was deleted.
   */
  it("only looks at published pieces", async () => {
    findFirstPiece.mockResolvedValue(null);

    await get();

    expect(findFirstPiece.mock.calls[0]![0].where).toEqual({
      slug: "abc",
      status: "PUBLISHED",
    });
  });

  it("decodes a Bengali slug before querying", async () => {
    findFirstPiece.mockResolvedValue(null);

    await get({ owner: "piece", slug: encodeURIComponent("রক্তকরবী") });

    expect(findFirstPiece.mock.calls[0]![0].where).toEqual({
      slug: "রক্তকরবী",
      status: "PUBLISHED",
    });
  });

  it("borrows a series cover from its first published episode, deterministically", async () => {
    findFirstSeries.mockResolvedValue({
      coverImage: null,
      pieces: [{ coverImage: `data:image/png;base64,${PNG_B64}` }],
    });

    const res = await get({ owner: "series", slug: "s" });

    expect(res.status).toBe(200);
    // Unfiltered and unordered, this returned whichever row Postgres handed
    // back first — so the same URL could serve a different image per request,
    // and could serve a draft's.
    expect(findFirstSeries.mock.calls[0]![0].select).toMatchObject({
      pieces: {
        where: { status: "PUBLISHED" },
        orderBy: { seriesOrder: "asc" },
        take: 1,
      },
    });
  });

  it("404s an unknown owner without querying", async () => {
    const res = await get({ owner: "author", slug: "x" });

    expect(res.status).toBe(404);
    expect(findFirstPiece).not.toHaveBeenCalled();
    expect(findFirstSeries).not.toHaveBeenCalled();
  });
});
