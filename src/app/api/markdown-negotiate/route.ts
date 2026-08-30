import { NextRequest, NextResponse } from "next/server";
import { renderPageMarkdown, render404Markdown } from "@/lib/markdown-renderer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/";

  try {
    const markdown = await renderPageMarkdown(path);

    if (!markdown) {
      // Nonexistent content -> return 404 with markdown recovery content
      const notFoundBody = render404Markdown(path);
      return new NextResponse(notFoundBody, {
        status: 404,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Vary": "Accept",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept",
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[markdown-negotiate] Error rendering markdown for", path, error);
    const fallback404 = render404Markdown(path);
    return new NextResponse(fallback404, {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept",
      },
    });
  }
}
