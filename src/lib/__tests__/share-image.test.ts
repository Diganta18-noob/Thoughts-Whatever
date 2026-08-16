import { describe, it, expect, jest } from "@jest/globals";

// `pieces.ts` wraps its queries in React's `cache()`, which only exists in the
// react canary Next.js bundles for the App Router — the installed react 18.3.1
// does not export it, so importing the module under jest throws without this.
jest.mock("react", () => ({
  ...(jest.requireActual("react") as object),
  cache: <T,>(fn: T) => fn,
}));

// Loaded with `require` rather than a top-level import purely for readability:
// the mock above must be understood as applying first.
const { sanitizeShareImage } = require("@/lib/pieces") as typeof import("@/lib/pieces");

const DATA_URI = "data:image/webp;base64,UklGRgAAAABXRUJQ";

describe("sanitizeShareImage", () => {
  it("drops a data-URI ogImage so the blob never reaches the payload", () => {
    expect(sanitizeShareImage({ ogImage: DATA_URI })).toEqual({ ogImage: null });
  });

  it("keeps a real ogImage URL, which is a valid share image", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/og.jpg";
    expect(sanitizeShareImage({ ogImage: url })).toEqual({ ogImage: url });
  });

  it("normalizes a missing or blank ogImage to null", () => {
    expect(sanitizeShareImage({ ogImage: undefined })).toEqual({ ogImage: null });
    expect(sanitizeShareImage({ ogImage: null })).toEqual({ ogImage: null });
    expect(sanitizeShareImage({ ogImage: "   " })).toEqual({ ogImage: null });
  });

  it("ignores leading whitespace when detecting a data URI", () => {
    expect(sanitizeShareImage({ ogImage: `  ${DATA_URI}` })).toEqual({ ogImage: null });
  });

  it("leaves every other field untouched", () => {
    const row = { slug: "রক্তকরবী", titleBn: "রক্তকরবী", ogImage: DATA_URI };
    expect(sanitizeShareImage(row)).toEqual({
      slug: "রক্তকরবী",
      titleBn: "রক্তকরবী",
      ogImage: null,
    });
  });

  it("does not mutate the row it is given", () => {
    const row = { ogImage: DATA_URI };
    sanitizeShareImage(row);
    expect(row.ogImage).toBe(DATA_URI);
  });
});
