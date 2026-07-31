import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@/lib/utils";

/**
 * Renders a 1080×1350 quote card.
 *
 * Node runtime, not edge: the Bengali fonts are read off disk, and they are
 * ~320KB each — well past what is comfortable to inline into an edge bundle.
 *
 * Satori is doing the real work here. The browser's canvas text API performs
 * no complex-script shaping, so drawing "ক্ষুধা" to a canvas produces three
 * detached glyphs instead of the conjunct. Satori shapes properly with a real
 * font, which is the whole reason this is a server route.
 */

export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5 — Instagram's tallest in-feed and story-safe ratio
const MAX_CHARS = 240;

const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");

let cachedFonts: { regular: Buffer; semibold: Buffer } | null = null;

async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const [regular, semibold] = await Promise.all([
    readFile(path.join(FONT_DIR, "NotoSerifBengali-Regular.ttf")),
    readFile(path.join(FONT_DIR, "NotoSerifBengali-SemiBold.ttf")),
  ]);
  cachedFonts = { regular, semibold };
  return cachedFonts;
}

/**
 * Bengali sets denser than Latin at the same point size, and a card that
 * overflows is worse than one that is slightly small. These break points were
 * chosen against the 240-char cap the picker enforces.
 */
function fontSizeFor(length: number) {
  if (length <= 60) return 68;
  if (length <= 110) return 58;
  if (length <= 170) return 48;
  return 41;
}

export async function GET(req: NextRequest) {
  const text = (req.nextUrl.searchParams.get("text") || "").trim().slice(0, MAX_CHARS);

  if (text.length < 4) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const fonts = await loadFonts();
    const size = fontSizeFor(text.length);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FDFBF5",
            padding: "84px 76px",
            fontFamily: "NotoSerifBengali",
          }}
        >
          {/* Top rule */}
          <div style={{ display: "flex", width: "132px", height: "3px", backgroundColor: "#8C2F1F" }} />

          {/* Quote */}
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "128px",
                lineHeight: 0.7,
                color: "#8C2F1F",
                opacity: 0.28,
                marginBottom: "18px",
              }}
            >
              “
            </div>
            <div
              style={{
                display: "flex",
                fontSize: `${size}px`,
                lineHeight: 1.75,
                color: "#1F1B16",
                fontWeight: 400,
                letterSpacing: 0,
              }}
            >
              {text}
            </div>
          </div>

          {/* Colophon */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              borderTop: "1px solid #DED5C2",
              paddingTop: "30px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: "34px", fontWeight: 600, color: "#8C2F1F" }}>
                {siteConfig.name}
              </div>
              <div style={{ display: "flex", fontSize: "21px", color: "#8A7F6E", marginTop: "8px" }}>
                {siteConfig.tagline}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: "21px", color: "#8A7F6E" }}>
              @thoughts.whatever_
            </div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
          { name: "NotoSerifBengali", data: fonts.regular, weight: 400, style: "normal" },
          { name: "NotoSerifBengali", data: fonts.semibold, weight: 600, style: "normal" },
        ],
        headers: {
          // Cards are deterministic for a given quote, so they cache hard.
          "Cache-Control": "public, max-age=3600, s-maxage=31536000, immutable",
        },
      },
    );
  } catch (error) {
    console.error("[quote-card] render failed", error);
    return NextResponse.json({ error: "could not render card" }, { status: 500 });
  }
}
