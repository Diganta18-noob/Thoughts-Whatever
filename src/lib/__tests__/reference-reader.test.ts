import {
  validateHostingRights,
  deriveCapabilities,
  getRightsBadgeMeta,
} from "../reference/rights-engine";
import { ReferenceHostingMode, ReferenceRightsStatus } from "@prisma/client";

describe("Reference Library Rights Engine & Reader Guardrails", () => {
  describe("validateHostingRights", () => {
    it("should throw error when hosting is THOUGHTS_WHATEVER and rights status is RIGHTS_UNVERIFIED", () => {
      expect(() => {
        validateHostingRights("THOUGHTS_WHATEVER", "RIGHTS_UNVERIFIED");
      }).toThrow(/Hosted assets require verified public-domain status/);
    });

    it("should throw error when hosting is THOUGHTS_WHATEVER and rights status is RESTRICTED", () => {
      expect(() => {
        validateHostingRights("THOUGHTS_WHATEVER", "RESTRICTED");
      }).toThrow(/Hosted assets require verified public-domain status/);
    });

    it("should throw error when hosting is THOUGHTS_WHATEVER and rights status is EXTERNAL_SOURCE", () => {
      expect(() => {
        validateHostingRights("THOUGHTS_WHATEVER", "EXTERNAL_SOURCE");
      }).toThrow(/Hosted assets require verified public-domain status/);
    });

    it("should succeed when hosting is THOUGHTS_WHATEVER and rights status is PUBLIC_DOMAIN", () => {
      expect(() => {
        validateHostingRights("THOUGHTS_WHATEVER", "PUBLIC_DOMAIN");
      }).not.toThrow();
    });

    it("should succeed when hosting is THOUGHTS_WHATEVER and rights status is LICENSED", () => {
      expect(() => {
        validateHostingRights("THOUGHTS_WHATEVER", "LICENSED");
      }).not.toThrow();
    });

    it("should succeed when hosting is EXTERNAL regardless of rights status", () => {
      expect(() => {
        validateHostingRights("EXTERNAL", "RIGHTS_UNVERIFIED");
      }).not.toThrow();
      expect(() => {
        validateHostingRights("EXTERNAL", "RESTRICTED");
      }).not.toThrow();
    });
  });

  describe("deriveCapabilities", () => {
    it("strictly blocks hosted reading and downloading for unverified Internet Archive upload", () => {
      const caps = deriveCapabilities({
        rightsStatus: "RIGHTS_UNVERIFIED",
        hostingMode: "EXTERNAL",
        sourceUrl: "https://archive.org/details/kalika-puran-ed-1/mode/1up",
        assets: [
          {
            kind: "PDF",
            fileUrl: "https://archive.org/download/kalika-puran-ed-1/KalikaPuran-Ed1.pdf",
            isDownloadable: true,
            isOnlineReadable: true,
          },
        ],
      });

      expect(caps.canReadOnline).toBe(false);
      expect(caps.canDownload).toBe(false);
      expect(caps.canViewOriginalSource).toBe(true);
      expect(caps.originalSourceUrl).toBe("https://archive.org/details/kalika-puran-ed-1/mode/1up");
      expect(caps.isRightsVerified).toBe(false);
      expect(caps.isHosted).toBe(false);
    });

    it("enables native reader and downloads for verified public domain edition", () => {
      const caps = deriveCapabilities({
        rightsStatus: "PUBLIC_DOMAIN",
        hostingMode: "THOUGHTS_WHATEVER",
        sourceUrl: "https://archive.org/details/dli.bengal.10689.2996",
        readerManifest: {
          pageCount: 794,
          pages: [{ pageNumber: 1, imageUrl: "https://thumb.wikimedia.org/page1.jpg" }],
        },
        assets: [
          {
            kind: "PDF",
            fileUrl: "https://upload.wikimedia.org/scan.pdf",
            isDownloadable: true,
            isOnlineReadable: true,
          },
        ],
      });

      expect(caps.canReadOnline).toBe(true);
      expect(caps.canDownload).toBe(true);
      expect(caps.downloadUrl).toBe("https://upload.wikimedia.org/scan.pdf");
      expect(caps.canViewOriginalSource).toBe(true);
      expect(caps.isRightsVerified).toBe(true);
      expect(caps.isHosted).toBe(true);
    });
  });

  describe("getRightsBadgeMeta", () => {
    it("returns correct badges and labels for all statuses", () => {
      const pd = getRightsBadgeMeta("PUBLIC_DOMAIN");
      expect(pd.variant).toBe("public-domain");
      expect(pd.labelEn).toBe("Public Domain");
      expect(pd.labelBn).toBe("পাবলিক ডোমেইন");

      const unverified = getRightsBadgeMeta("RIGHTS_UNVERIFIED");
      expect(unverified.variant).toBe("unverified");
      expect(unverified.labelEn).toBe("Rights Unverified");
      expect(unverified.labelBn).toBe("স্বত্ব অপরীক্ষিত");

      const licensed = getRightsBadgeMeta("LICENSED");
      expect(licensed.variant).toBe("licensed");

      const ext = getRightsBadgeMeta("EXTERNAL_SOURCE");
      expect(ext.variant).toBe("external");

      const restricted = getRightsBadgeMeta("RESTRICTED");
      expect(restricted.variant).toBe("restricted");
    });
  });
});
