import React from "react";
import { StoryReadLink } from "@/components/ui/story-read-link";
import { NavLabel } from "@/components/i18n/nav-label";
import { siteConfig } from "@/lib/utils";

// Mock language provider to test both English and Bengali states
let mockIsBn = false;
jest.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    locale: mockIsBn ? "bn" : "en",
    isBn: mockIsBn,
    t: (key: string) => {
      const map: Record<string, string> = {
        "header.home": "Home",
        "home.continueReading": "Continue Reading",
        "home.latestSeries": "Latest Series",
        "home.exploreArchive": "Explore Archive",
        "letter.send": "Send",
        "letter.emailPlaceholder": "Your email address",
      };
      return map[key] || key;
    },
  }),
}));

describe("21-Point Usability Audit Regression Suite", () => {
  beforeEach(() => {
    mockIsBn = false;
  });

  describe("Issue 8: Standardized StoryReadLink", () => {
    it("renders standardized 'Read Story' label in English mode", () => {
      mockIsBn = false;
      const element = StoryReadLink({ href: "/writing/test-slug" });
      expect(element).toBeDefined();
      expect(element.props.href).toBe("/writing/test-slug");
      // Validate display label
      const children = React.Children.toArray(element.props.children);
      const labelSpan = children[0] as React.ReactElement;
      expect(labelSpan.props.children).toBe("Read Story");
    });

    it("renders standardized 'রচনাটি পড়ুন' label in Bengali mode", () => {
      mockIsBn = true;
      const element = StoryReadLink({ href: "/writing/test-slug" });
      expect(element).toBeDefined();
      const children = React.Children.toArray(element.props.children);
      const labelSpan = children[0] as React.ReactElement;
      expect(labelSpan.props.children).toBe("রচনাটি পড়ুন");
    });

    it("supports button and pill variants with min-44px targets", () => {
      mockIsBn = false;
      const buttonElem = StoryReadLink({ href: "/series/test", variant: "button" });
      expect(buttonElem.props.className).toContain("min-h-[44px]");

      const pillElem = StoryReadLink({ href: "/series/test", variant: "pill" });
      expect(pillElem.props.className).toContain("min-h-[44px]");
    });
  });

  describe("Issue 21: Bilingual Navigation Tabular Alignment", () => {
    it("renders tabular two-column grid structure in English mode", () => {
      mockIsBn = false;
      const element = NavLabel({
        item: { labelEn: "Documentary", labelBn: "তথ্যচিত্র" },
      });
      expect(element.props.className).toContain("grid-cols-");
      const children = React.Children.toArray(element.props.children);
      const enSpan = children[0] as React.ReactElement;
      const bnSpan = children[1] as React.ReactElement;
      expect(enSpan.props.children).toBe("Documentary");
      expect(bnSpan.props.children).toBe("তথ্যচিত্র");
    });

    it("renders single Bengali label in Bengali mode", () => {
      mockIsBn = true;
      const element = NavLabel({
        item: { labelEn: "Documentary", labelBn: "তথ্যচিত্র" },
      });
      expect(element.props.children).toBe("তথ্যচিত্র");
    });
  });

  describe("Issue 3 & 4: Tagline Casing Consistency", () => {
    it("preserves title-cased tagline in siteConfig", () => {
      expect(siteConfig.taglineEn).toBe("A Little Bit More");
      expect(siteConfig.tagline).toBe("আরও একটু বেশি");
    });
  });
});
