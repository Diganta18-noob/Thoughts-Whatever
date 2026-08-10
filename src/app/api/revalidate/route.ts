import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expectedSecret = process.env.AUTH_SECRET;

  if (secret && expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Revalidate main layout and key listing pages
    revalidatePath("/", "layout");
    revalidatePath("/series");
    revalidatePath("/series/[slug]", "page");
    revalidatePath("/writing");
    revalidatePath("/writing/[slug]", "page");
    revalidatePath("/documentary");
    revalidatePath("/documentary/[slug]", "page");
    revalidatePath("/blog");
    revalidatePath("/archive");
    revalidatePath("/authors");
    revalidatePath("/api/search-index");

    return NextResponse.json({ ok: true, revalidated: true, timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Revalidation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
