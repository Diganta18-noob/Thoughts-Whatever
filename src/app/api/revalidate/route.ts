import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expectedSecret = process.env.AUTH_SECRET;

  if (secret && expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const type = searchParams.get("type")?.toLowerCase() || "full";
  const slug = searchParams.get("slug");
  const seriesSlug = searchParams.get("seriesSlug");

  const revalidatedPaths: string[] = [];

  try {
    if (type === "rachana") {
      revalidatePath("/");
      revalidatePath("/writing");
      revalidatedPaths.push("/", "/writing");
      if (slug) {
        revalidatePath(`/writing/${slug}`);
        revalidatedPaths.push(`/writing/${slug}`);
      }
      revalidatePath("/archive");
      revalidatedPaths.push("/archive");
    } else if (type === "blog") {
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatedPaths.push("/", "/blog");
      if (slug) {
        revalidatePath(`/blog/${slug}`);
        revalidatedPaths.push(`/blog/${slug}`);
      }
      revalidatePath("/archive");
      revalidatedPaths.push("/archive");
    } else if (type === "documentary") {
      revalidatePath("/");
      revalidatePath("/documentary");
      revalidatedPaths.push("/", "/documentary");
      if (slug) {
        revalidatePath(`/documentary/${slug}`);
        revalidatedPaths.push(`/documentary/${slug}`);
      }
      revalidatePath("/archive");
      revalidatedPaths.push("/archive");
    } else if (type === "series") {
      revalidatePath("/");
      revalidatePath("/series");
      revalidatedPaths.push("/", "/series");
      if (slug || seriesSlug) {
        const sSlug = slug || seriesSlug;
        revalidatePath(`/series/${sSlug}`);
        revalidatedPaths.push(`/series/${sSlug}`);
      }
    } else if (type === "author") {
      revalidatePath("/");
      revalidatePath("/authors");
      revalidatedPaths.push("/", "/authors");
      if (slug) {
        revalidatePath(`/authors/${slug}`);
        revalidatedPaths.push(`/authors/${slug}`);
      }
    } else {
      // Full revalidation fallback
      revalidatePath("/", "layout");
      revalidatePath("/series");
      revalidatePath("/writing");
      revalidatePath("/documentary");
      revalidatePath("/blog");
      revalidatePath("/archive");
      revalidatePath("/authors");
      revalidatePath("/api/search-index");
      revalidatedPaths.push("ALL (layout & listings)");
    }

    return NextResponse.json({
      ok: true,
      type,
      revalidatedPaths,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Revalidation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
