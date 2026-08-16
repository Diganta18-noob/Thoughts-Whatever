import { describe, it, expect } from "@jest/globals";
import { resolveCover, resolveRemoteTarget } from "@/lib/cover-resolver";

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

  it("treats an https value as a remote target", () => {
    const r = resolveCover("https://res.cloudinary.com/demo/image/upload/a.webp");
    expect(r).toEqual({ kind: "remote", url: "https://res.cloudinary.com/demo/image/upload/a.webp" });
  });

  it("treats a site-relative value as a remote target", () => {
    expect(resolveCover("/covers/x.jpg")).toEqual({ kind: "remote", url: "/covers/x.jpg" });
  });

  it("refuses to point at the cover endpoint itself (loop guard)", () => {
    expect(resolveCover("/api/cover/piece/abc").kind).toBe("missing");
    expect(resolveCover("https://example.com/api/cover/piece/abc").kind).toBe("missing");
    expect(resolveCover("//evil.example.com/api/cover/piece/abc").kind).toBe("missing");
  });

  it("rejects protocol-relative values", () => {
    expect(resolveCover("//evil.example.com/x.jpg").kind).toBe("missing");
  });

  it("rejects junk that is neither a data URI nor a URL", () => {
    expect(resolveCover("not-a-url").kind).toBe("missing");
    expect(resolveCover("javascript:alert(1)").kind).toBe("missing");
  });
});

const REQUEST_URL = "https://thoughts-whatever.vercel.app/api/cover/piece/abc";

describe("resolveRemoteTarget", () => {
  it("accepts a host next/image is already allowed to optimize", () => {
    const target = resolveRemoteTarget(
      "https://res.cloudinary.com/demo/image/upload/a.webp",
      REQUEST_URL,
    );
    expect(target?.href).toBe("https://res.cloudinary.com/demo/image/upload/a.webp");
  });

  it("refuses a host outside the image allowlist", () => {
    // The 307 this replaced was fetched by the browser; fetching server-side
    // makes any stored value an outbound request from our own function.
    expect(resolveRemoteTarget("https://evil.example.com/x.jpg", REQUEST_URL)).toBeNull();
  });

  it("refuses plain http, including link-local metadata addresses", () => {
    expect(resolveRemoteTarget("http://res.cloudinary.com/demo/a.webp", REQUEST_URL)).toBeNull();
    expect(
      resolveRemoteTarget("http://169.254.169.254/latest/meta-data/", REQUEST_URL),
    ).toBeNull();
  });

  it("resolves a site-relative cover against the request's own origin", () => {
    // `fetch` cannot take a relative URL, but a redirect used to handle these
    // for free, so they must keep working.
    const target = resolveRemoteTarget("/covers/x.jpg", REQUEST_URL);
    expect(target?.href).toBe("https://thoughts-whatever.vercel.app/covers/x.jpg");
  });

  it("accepts an absolute URL on our own origin", () => {
    const target = resolveRemoteTarget(
      "https://thoughts-whatever.vercel.app/covers/x.jpg",
      REQUEST_URL,
    );
    expect(target?.href).toBe("https://thoughts-whatever.vercel.app/covers/x.jpg");
  });

  it("re-checks the loop guard after resolution", () => {
    expect(resolveRemoteTarget("/api/cover/piece/abc", REQUEST_URL)).toBeNull();
    expect(resolveRemoteTarget("./def", REQUEST_URL)).toBeNull();
    expect(
      resolveRemoteTarget("https://res.cloudinary.com/api/cover/x", REQUEST_URL),
    ).toBeNull();
  });

  it("refuses when either URL cannot be parsed", () => {
    expect(resolveRemoteTarget("/covers/x.jpg", "not-a-url")).toBeNull();
    expect(resolveRemoteTarget("http://[", REQUEST_URL)).toBeNull();
  });
});
