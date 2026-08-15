import { describe, it, expect } from "@jest/globals";
import { resolveCover } from "@/lib/cover-resolver";

// 1x1 transparent PNG
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF/AAAAAABJRU5ErkJggg==";

describe("resolveCover", () => {
  it("returns missing for empty, null, and whitespace input", () => {
    expect(resolveCover(null).kind).toBe("missing");
    expect(resolveCover(undefined).kind).toBe("missing");
    expect(resolveCover("   ").kind).toBe("missing");
  });

  it("decodes a base64 data URI into bytes", () => {
    const r = resolveCover(`data:image/png;base64,${PNG_B64}`);
    expect(r.kind).toBe("data");
    if (r.kind !== "data") throw new Error("expected data");
    expect(r.mime).toBe("image/png");
    expect(r.bytes.byteLength).toBeGreaterThan(20);
    expect(r.bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  });

  it("normalises legacy mime aliases", () => {
    const r = resolveCover(`data:image/jpg;base64,${PNG_B64}`);
    if (r.kind !== "data") throw new Error("expected data");
    expect(r.mime).toBe("image/jpeg");
  });

  it("rejects a non-image data URI", () => {
    expect(resolveCover("data:text/html;base64,PGgxPmhpPC9oMT4=").kind).toBe("missing");
  });

  it("rejects a data URI whose payload decodes to nothing", () => {
    expect(resolveCover("data:image/png;base64,").kind).toBe("missing");
  });

  it("treats an https value as a remote redirect target", () => {
    const r = resolveCover("https://res.cloudinary.com/demo/image/upload/a.webp");
    expect(r).toEqual({ kind: "remote", url: "https://res.cloudinary.com/demo/image/upload/a.webp" });
  });

  it("treats a site-relative value as a remote redirect target", () => {
    expect(resolveCover("/covers/x.jpg")).toEqual({ kind: "remote", url: "/covers/x.jpg" });
  });

  it("refuses to redirect to the cover endpoint itself (loop guard)", () => {
    expect(resolveCover("/api/cover/piece/abc").kind).toBe("missing");
    expect(resolveCover("https://example.com/api/cover/piece/abc").kind).toBe("missing");
  });

  it("rejects junk that is neither a data URI nor a URL", () => {
    expect(resolveCover("not-a-url").kind).toBe("missing");
    expect(resolveCover("javascript:alert(1)").kind).toBe("missing");
  });
});
