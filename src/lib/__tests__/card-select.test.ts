import { describe, it, expect, jest } from "@jest/globals";

// `pieces.ts` wraps its queries in React's `cache()`, which only exists in the
// react canary Next.js bundles for the App Router — the installed react 18.3.1
// does not export it, so importing the module under jest throws without this.
jest.mock("react", () => ({
  ...(jest.requireActual("react") as object),
  cache: <T,>(fn: T) => fn,
}));

// `require`, not `import`: the mock above must be installed before `pieces.ts`
// is evaluated, and a static import is hoisted above it.
const { cardSelect } = require("@/lib/pieces") as typeof import("@/lib/pieces");

describe("cardSelect", () => {
  it("never selects the coverImage blob column", () => {
    expect("coverImage" in cardSelect).toBe(false);
  });

  it("selects the cheap dimension columns so cards can size images", () => {
    expect(cardSelect).toMatchObject({
      coverImageWidth: true,
      coverImageHeight: true,
    });
  });

  it("still selects the fields cards render", () => {
    for (const field of [
      "slug",
      "kind",
      "titleBn",
      "dekBn",
      "excerptBn",
      "readingMinutes",
      "featured",
      "publishedAt",
      "audioUrl",
      "seriesOrder",
    ]) {
      expect(cardSelect).toHaveProperty(field, true);
    }
  });

  it("does not select the bodyBn blob either", () => {
    expect("bodyBn" in cardSelect).toBe(false);
  });
});
