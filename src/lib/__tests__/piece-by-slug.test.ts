import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// `pieces.ts` wraps its queries in React's `cache()`, which the App Router
// polyfills but the installed react 18.3.1 does not export.
jest.mock("react", () => ({
  ...(jest.requireActual("react") as object),
  cache: <T,>(fn: T) => fn,
}));

type FindFirstArgs = { where?: unknown; select?: Record<string, unknown> };
type Row = { slug: string } & Record<string, unknown>;

const findFirst = jest.fn<(args: FindFirstArgs) => Promise<Row | null>>();
const queryRaw = jest.fn<() => Promise<Array<{ slug: string; prefix: string | null }>>>();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    piece: { findFirst: (args: FindFirstArgs) => findFirst(args) },
    $queryRaw: () => queryRaw(),
  },
}));

const { getPieceBySlug } = require("@/lib/pieces") as typeof import("@/lib/pieces");

const SLUG = "crime-and-punishment-1";
const DATA_URI = "data:image/webp;base64,AAAA";

beforeEach(() => {
  findFirst.mockReset();
  findFirst.mockResolvedValue({ slug: SLUG });
  queryRaw.mockReset();
  queryRaw.mockResolvedValue([]);
});

describe("getPieceBySlug", () => {
  /**
   * The regression guard for this query's shape. It used `include:`, which pulls
   * every scalar on the row — which is how `ogImage` kept crossing the database
   * boundary (~223 KB per article) long after `coverImage` had been removed from
   * every list query. An explicit select is what makes the next blob-shaped
   * column on `Piece` a non-event, so a change back to `include` must fail here.
   */
  it("never asks the database for either blob column", async () => {
    await getPieceBySlug(SLUG);

    const args = findFirst.mock.calls[0]![0];
    expect(args.select).toBeDefined();
    expect(args.select).not.toHaveProperty("coverImage");
    expect(args.select).not.toHaveProperty("ogImage");
    // The cheap dimension columns still come along, so the hero can reserve space.
    expect(args.select).toMatchObject({
      coverImageWidth: true,
      coverImageHeight: true,
      bodyBn: true,
    });
  });

  it("only serves published pieces", async () => {
    await getPieceBySlug(SLUG, "BLOG");

    expect(findFirst.mock.calls[0]![0].where).toEqual({
      slug: SLUG,
      status: "PUBLISHED",
      kind: "BLOG",
    });
  });

  it("returns null for a slug that matches nothing", async () => {
    findFirst.mockResolvedValue(null);
    await expect(getPieceBySlug(SLUG)).resolves.toBeNull();
  });

  it("hands the page a cover URL, never image bytes", async () => {
    const piece = await getPieceBySlug(SLUG);
    expect(piece!.coverImage).toBe(`/api/cover/piece/${SLUG}`);
  });

  /**
   * `ogImage` is read as a bounded prefix rather than selected, so the two
   * outcomes that matter are that a real share-image URL survives the round trip
   * and a data URI — which every legacy row holds, a byte-for-byte copy of the
   * cover — does not.
   */
  it("keeps a real ogImage URL as the share image", async () => {
    const url = "https://res.cloudinary.com/demo/image/upload/og.webp";
    queryRaw.mockResolvedValue([{ slug: SLUG, prefix: url }]);

    const piece = await getPieceBySlug(SLUG);
    expect(piece!.ogImage).toBe(url);
  });

  it("drops a data-URI ogImage, which renders nothing anyway", async () => {
    queryRaw.mockResolvedValue([{ slug: SLUG, prefix: DATA_URI }]);

    const piece = await getPieceBySlug(SLUG);
    expect(piece!.ogImage).toBeNull();
  });

  it("leaves ogImage null when the row has none", async () => {
    const piece = await getPieceBySlug(SLUG);
    expect(piece!.ogImage).toBeNull();
  });
});
