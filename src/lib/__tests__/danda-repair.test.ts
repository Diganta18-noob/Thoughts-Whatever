import {
  DANDA,
  hasCorruption,
  tokenAround,
  makeWordChecker,
  repairString,
} from "@/lib/danda-repair";

const isWord = makeWordChecker([
  "mortals", "uneasy", "lies", "the", "head", "that", "wears",
  "nothing", "first", "enters", "life", "of", "without", "a", "curse",
  "sophocles", "michael", "devil", "bengali", "itself", "cruelest",
]);

describe("hasCorruption", () => {
  it("flags a danda immediately after a Latin letter", () => {
    expect(hasCorruption(`morta${DANDA} s`)).toBe(true);
  });

  it("ignores a legitimate danda ending a Bengali sentence", () => {
    expect(hasCorruption(`আমি রেকর্ড করে দিয়েছিলাম${DANDA}`)).toBe(false);
  });

  it("ignores a danda followed by a Latin letter with no letter before it", () => {
    expect(hasCorruption(`শোনাবেন${DANDA} and then`)).toBe(false);
  });
});

describe("tokenAround", () => {
  it("returns the maximal Latin run containing the position", () => {
    expect(tokenAround("say mortals now", 6)).toBe("mortals");
  });

  it("returns an empty string when the position is not on a letter", () => {
    expect(tokenAround("say  now", 3)).toBe("");
  });
});

describe("repairString", () => {
  it("chooses the join reading when it forms a real word", () => {
    const r = repairString(`morta${DANDA} s without a curse`, isWord);
    expect(r.text).toBe("mortals without a curse");
    expect(r.resolved).toBe(1);
    expect(r.reviews).toHaveLength(0);
  });

  it("chooses the split reading when the joined form is not a word", () => {
    const r = repairString(`Uneasy${DANDA} ies the head`, isWord);
    expect(r.text).toBe("Uneasy lies the head");
    expect(r.resolved).toBe(1);
  });

  it("repairs several occurrences in one string", () => {
    const r = repairString(
      `Nothing first enters the${DANDA} ife of morta${DANDA} s`,
      isWord,
    );
    expect(r.text).toBe("Nothing first enters the life of mortals");
    expect(r.resolved).toBe(2);
  });

  it("reviews rather than guesses when both readings are words", () => {
    // "be। ow" reads as "below" or as "be low". Both are real English.
    const both = makeWordChecker(["below", "be", "low"]);
    const r = repairString(`be${DANDA} ow`, both);
    expect(r.resolved).toBe(0);
    expect(r.reviews).toHaveLength(1);
    expect(r.reviews[0].reason).toMatch(/ambiguous/i);
    expect(r.reviews[0].joined).toBe("below");
    expect(r.reviews[0].split).toBe("be low");
    expect(r.text).toBe(`be${DANDA} ow`);
  });

  it("reviews when neither reading is a word", () => {
    const r = repairString(`xq${DANDA} zv`, isWord);
    expect(r.resolved).toBe(0);
    expect(r.reviews).toHaveLength(1);
    expect(r.reviews[0].reason).toMatch(/neither/i);
  });

  it("leaves legitimate Bengali dandas untouched", () => {
    const src = `আমি গাইতে পারি নাই${DANDA} morta${DANDA} s`;
    const r = repairString(src, isWord);
    expect(r.text).toBe(`আমি গাইতে পারি নাই${DANDA} mortals`);
    expect(r.resolved).toBe(1);
  });

  it("handles a corrupted occurrence with no trailing space", () => {
    const r = repairString(`morta${DANDA}s`, isWord);
    expect(r.text).toBe("mortals");
  });

  it("is case-insensitive in its word lookup", () => {
    const r = repairString(`Sophoc${DANDA} es`, isWord);
    expect(r.text).toBe("Sophocles");
  });

  it("returns clean text unchanged", () => {
    const r = repairString("Nothing first enters the life of mortals", isWord);
    expect(r.text).toBe("Nothing first enters the life of mortals");
    expect(r.resolved).toBe(0);
    expect(r.reviews).toHaveLength(0);
  });
});

describe("makeWordChecker", () => {
  it("matches regardless of case", () => {
    const ok = makeWordChecker(["Lies"]);
    expect(ok("lies")).toBe(true);
    expect(ok("LIES")).toBe(true);
  });

  it("strips a possessive suffix before a second lookup", () => {
    const ok = makeWordChecker(["mortal"]);
    expect(ok("mortal's")).toBe(true);
  });

  it("rejects an empty token", () => {
    expect(makeWordChecker(["a"])("")).toBe(false);
  });
});
