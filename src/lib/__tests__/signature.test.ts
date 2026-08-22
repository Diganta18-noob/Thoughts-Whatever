import { describe, it, expect } from "@jest/globals";
import { stripThoughtsSignature, stripMarkdown } from "@/lib/markdown";

describe("Automatic Signature - stripThoughtsSignature", () => {
  it("leaves clean content without signature unchanged", () => {
    const raw = "This is the final paragraph of the article.";
    expect(stripThoughtsSignature(raw)).toBe("This is the final paragraph of the article.");
  });

  it("strips exact signature '— thoughts.whatever'", () => {
    const raw = `This is the final paragraph.\n\n— thoughts.whatever`;
    expect(stripThoughtsSignature(raw)).toBe("This is the final paragraph.");
  });

  it("strips signature without space '—thoughts.whatever'", () => {
    const raw = `This is the final paragraph.\n\n—thoughts.whatever`;
    expect(stripThoughtsSignature(raw)).toBe("This is the final paragraph.");
  });

  it("strips signature with multiple spaces '—  thoughts.whatever'", () => {
    const raw = `This is the final paragraph.\n\n—  thoughts.whatever`;
    expect(stripThoughtsSignature(raw)).toBe("This is the final paragraph.");
  });

  it("strips signature with hyphens or en-dashes '- thoughts.whatever' or '-- thoughts.whatever'", () => {
    const raw1 = `This is the final paragraph.\n\n- thoughts.whatever`;
    const raw2 = `This is the final paragraph.\n\n-- thoughts.whatever`;
    const raw3 = `This is the final paragraph.\n\n– thoughts.whatever`;
    expect(stripThoughtsSignature(raw1)).toBe("This is the final paragraph.");
    expect(stripThoughtsSignature(raw2)).toBe("This is the final paragraph.");
    expect(stripThoughtsSignature(raw3)).toBe("This is the final paragraph.");
  });

  it("strips duplicate multiple signatures", () => {
    const raw = `Final paragraph.\n\n— thoughts.whatever\n\n— thoughts.whatever\n\n- thoughts.whatever`;
    expect(stripThoughtsSignature(raw)).toBe("Final paragraph.");
  });

  it("does not remove normal text containing the word thoughts or whatever in other context", () => {
    const raw = `These thoughts are inspiring, whatever the outcome might be.\n\nMore thoughts on literature.`;
    expect(stripThoughtsSignature(raw)).toBe(
      `These thoughts are inspiring, whatever the outcome might be.\n\nMore thoughts on literature.`
    );
  });

  it("stripMarkdown also filters out signature from excerpts", () => {
    const raw = `This is the story.\n\n— thoughts.whatever`;
    expect(stripMarkdown(raw)).toBe("This is the story.");
  });
});
