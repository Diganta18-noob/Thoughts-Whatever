import { deriveCapabilities } from "../reference/rights-engine";

test("supplied goddess reference can be read without granting download or verified rights", () => {
  const caps = deriveCapabilities({
    workSlug: "in-the-name-of-the-goddess",
    hostingMode: "THOUGHTS_WHATEVER",
    rightsStatus: "RIGHTS_UNVERIFIED",
    readerManifest: { pages: [{ pageNumber: 1, imageUrl: "https://example.com/1.jpg" }] },
    assets: [{ kind: "PDF", fileUrl: "https://example.com/book.pdf", isDownloadable: true }],
  });
  expect(caps.canReadOnline).toBe(true);
  expect(caps.canDownload).toBe(false);
  expect(caps.downloadUrl).toBeNull();
  expect(caps.isRightsVerified).toBe(false);
});

test("other unverified references retain the existing reading guard", () => {
  const caps = deriveCapabilities({ workSlug: "another-book", hostingMode: "THOUGHTS_WHATEVER", rightsStatus: "RIGHTS_UNVERIFIED", readerManifest: { pages: [{ pageNumber: 1, imageUrl: "https://example.com/1.jpg" }] } });
  expect(caps.canReadOnline).toBe(false);
});


test("image-only supplied book has a catalogue reading action without loading its full manifest", () => {
  const caps = deriveCapabilities({ workSlug: "in-the-name-of-the-goddess", hostingMode: "THOUGHTS_WHATEVER", rightsStatus: "RIGHTS_UNVERIFIED", assets: [{ kind: "SCAN_IMAGE", fileUrl: "https://example.com/1.jpg", isOnlineReadable: true, isDownloadable: false }] });
  expect(caps.canReadOnline).toBe(true);
  expect(caps.canDownload).toBe(false);
});
