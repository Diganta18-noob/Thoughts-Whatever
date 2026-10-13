import { normalizeTranslationText, needsEnglishTranslation, validateTranslations } from "../content-translation";

describe("English content translations", () => {
  it("normalizes layout whitespace without changing the source meaning", () => {
    expect(normalizeTranslationText("  পরে\n পড়ব  ")).toBe("পরে পড়ব");
  });
  it("only requests Bengali source text", () => {
    expect(needsEnglishTranslation("Privacy Policy")).toBe(false);
    expect(needsEnglishTranslation("গোপনীয়তা নীতি")).toBe(true);
  });
  it("rejects missing, empty, or still Bengali results", () => {
    expect(() => validateTranslations(["পরে পড়ব"], {})).toThrow();
    expect(() => validateTranslations(["পরে পড়ব"], { "0": "" })).toThrow();
    expect(() => validateTranslations(["পরে পড়ব"], { "0": "পরে পড়ব" })).toThrow();
  });
  it("returns only requested text, without interpreting translation as HTML", () => {
    expect(validateTranslations(["পরে পড়ব"], { "0": "Read later", extra: "Ignore" })).toEqual({ "পরে পড়ব": "Read later" });
  });
});
