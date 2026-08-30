import { describe, it, expect, jest } from "@jest/globals";

// Polyfill React.cache for Jest test environment
jest.mock("react", () => ({
  ...(jest.requireActual("react") as object),
  cache: <T,>(fn: T) => fn,
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    piece: {
      findMany: jest.fn<any>().mockResolvedValue([]),
      findUnique: jest.fn<any>().mockResolvedValue(null),
    },
    series: {
      findMany: jest.fn<any>().mockResolvedValue([]),
      findUnique: jest.fn<any>().mockResolvedValue(null),
    },
    author: {
      findMany: jest.fn<any>().mockResolvedValue([]),
      findUnique: jest.fn<any>().mockResolvedValue(null),
    },
  },
}));

import { parseAcceptHeader, negotiateContentType, isContentNegotiablePath } from "@/lib/content-negotiation";
import { render404Markdown, renderPageMarkdown, renderHomeMarkdown } from "@/lib/markdown-renderer";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/utils";

describe("Phase 3: Content Negotiation (RFC 7231 & acceptmarkdown.com)", () => {
  it("parses simple Accept headers", () => {
    const parsed = parseAcceptHeader("text/markdown");
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({ type: "text", subtype: "markdown", q: 1.0 });
  });

  it("parses Accept headers with quality (q) values", () => {
    const header = "text/html, text/markdown;q=0.9, application/xhtml+xml;q=0.8, */*;q=0.1";
    const parsed = parseAcceptHeader(header);
    expect(parsed[0].type).toBe("text");
    expect(parsed[0].subtype).toBe("html");
    expect(parsed[0].q).toBe(1.0);

    const md = parsed.find((p) => p.subtype === "markdown");
    expect(md?.q).toBe(0.9);
  });

  it("negotiates text/markdown when explicitly requested with higher q", () => {
    expect(negotiateContentType("text/markdown")).toBe("markdown");
    expect(negotiateContentType("text/markdown, text/html;q=0.5")).toBe("markdown");
    expect(negotiateContentType("text/markdown;q=1.0, text/html;q=0.8")).toBe("markdown");
  });

  it("negotiates text/html for standard browser Accept headers", () => {
    const browserAccept = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
    expect(negotiateContentType(browserAccept)).toBe("html");
    expect(negotiateContentType("text/html")).toBe("html");
    expect(negotiateContentType("*/*")).toBe("html");
    expect(negotiateContentType("")).toBe("html");
    expect(negotiateContentType(null)).toBe("html");
  });

  it("returns not_acceptable (406) for explicit unsupported Accept headers", () => {
    expect(negotiateContentType("application/json")).toBe("not_acceptable");
    expect(negotiateContentType("image/png, image/jpeg")).toBe("not_acceptable");
    expect(negotiateContentType("application/xml")).toBe("not_acceptable");
  });

  it("correctly identifies content negotiable paths", () => {
    expect(isContentNegotiablePath("/")).toBe(true);
    expect(isContentNegotiablePath("/writing")).toBe(true);
    expect(isContentNegotiablePath("/writing/kazi-nazrul-islam")).toBe(true);
    expect(isContentNegotiablePath("/about")).toBe(true);
    expect(isContentNegotiablePath("/contact")).toBe(true);
    expect(isContentNegotiablePath("/privacy")).toBe(true);
    expect(isContentNegotiablePath("/series")).toBe(true);

    // Should NOT negotiate for internal assets or APIs
    expect(isContentNegotiablePath("/_next/static/chunks/main.js")).toBe(false);
    expect(isContentNegotiablePath("/api/health")).toBe(false);
    expect(isContentNegotiablePath("/admin/pieces")).toBe(false);
    expect(isContentNegotiablePath("/brand/logo.svg")).toBe(false);
    expect(isContentNegotiablePath("/robots.txt")).toBe(false);
    expect(isContentNegotiablePath("/sitemap.xml")).toBe(false);
  });
});

describe("Phase 1 & 3: Markdown Renderer and 404 Recovery", () => {
  it("renders rich, agent-friendly 404 recovery markdown", () => {
    const md = render404Markdown("/some-nonexistent-path");
    expect(md).toContain("404 — Page Not Found");
    expect(md).toContain("/some-nonexistent-path");
    expect(md).toContain("/sitemap.xml");
    expect(md).toContain("/llms.txt");
    expect(md).toContain("/writing");
    expect(md).toContain("/archive");
    expect(md).toContain("/about");
    expect(md).toContain("/contact");
  });

  it("renders rich homepage markdown", async () => {
    const md = await renderHomeMarkdown();
    expect(md).toContain(siteConfig.name);
    expect(md).toContain("About the Publication");
    expect(md).toContain("/writing");
    expect(md).toContain("/llms.txt");
    expect(md).toContain("/sitemap.xml");
  });

  it("renders static trust anchor pages in markdown", async () => {
    const aboutMd = await renderPageMarkdown("/about");
    expect(aboutMd).not.toBeNull();
    expect(aboutMd).toContain("About Thoughts Whatever");
    expect(aboutMd).toContain(siteConfig.instagram);

    const contactMd = await renderPageMarkdown("/contact");
    expect(contactMd).not.toBeNull();
    expect(contactMd).toContain("Contact Thoughts Whatever");
    expect(contactMd).toContain("Instagram");

    const privacyMd = await renderPageMarkdown("/privacy");
    expect(privacyMd).not.toBeNull();
    expect(privacyMd).toContain("Privacy Policy");
    expect(privacyMd).toContain("Local Browser Storage");
    expect(privacyMd).toContain("PostHog");
  });
});

describe("Phase 5 & 7: Organization & WebSite JSON-LD Schema", () => {
  it("generates complete Organization schema with contactPoint and branding", () => {
    const org = organizationJsonLd();
    expect(org["@context"]).toBe("https://schema.org");
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("Thoughts Whatever");
    expect(org.alternateName).toContain("Thoughts Whatever");
    expect(org.url).toContain("thoughtswhatever.in");
    expect(org.logo).toContain("/brand/logo-full.svg");
    expect(org.sameAs).toContain("https://www.instagram.com/thoughts.whatever_/");
    expect(org.contactPoint).toBeDefined();
    expect(org.contactPoint["@type"]).toBe("ContactPoint");
    expect(org.contactPoint.url).toContain("/contact");
    expect(org.contactPoint.contactType).toBe("editorial inquiry");
  });

  it("generates WebSite schema referencing the Organization publisher", () => {
    const site = websiteJsonLd();
    expect(site["@context"]).toBe("https://schema.org");
    expect(site["@type"]).toBe("WebSite");
    expect(site.name).toBe("Thoughts Whatever");
    expect(site.publisher).toBeDefined();
    expect(site.publisher["@type"]).toBe("Organization");
    expect(site.potentialAction).toBeDefined();
  });
});
