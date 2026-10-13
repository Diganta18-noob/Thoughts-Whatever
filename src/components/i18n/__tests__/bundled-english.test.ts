import { englishText } from "../translation-store";
import content from "../../../../locales/content-en.json";
import { TIMELINE_DATA, TIMELINE_FAQS } from "@/lib/timeline-data";

describe("bundled English content", () => {
  it("contains no Bengali script in its English values", () => {
    expect(Object.values(content).filter(text => /[\u0980-\u09ff]/.test(text))).toEqual([]);
  });
  it("covers every timeline entry including expanded context and key points", () => {
    for (const item of TIMELINE_DATA) {
      for (const source of [item.titleBn, item.authorBn, item.significanceBn, item.historicalContextBn, item.eraNameBn, ...item.keyPointsBn]) {
        expect(englishText(source)).toBeTruthy();
        expect(englishText(source)).not.toMatch(/[\u0980-\u09ff]/);
      }
    }
    TIMELINE_FAQS.forEach(faq => { expect(englishText(faq.question)).toBeTruthy(); expect(englishText(faq.answer)).toBeTruthy(); });
  });
  it("preserves URLs, Latin text, and converts Bengali digits locally", () => {
    expect(englishText("2026 — Thoughts Whatever")).toBe("2026 — Thoughts Whatever");
    expect(englishText("১৮০০ — ২০২৫")).toBe("1800 — 2025");
  });
  it("does not silently return an untranslated source as English", () => {
    expect(englishText("এই লেখাটি অনুবাদ করা হয়নি")).toBeUndefined();
  });
});
