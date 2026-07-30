import { NextResponse } from "next/server";
import { getArticles } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category");
  const seriesSlug = searchParams.get("series");
  const searchQuery = searchParams.get("search");
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

  const articles = await getArticles({
    categorySlug: categorySlug || undefined,
    seriesSlug: seriesSlug || undefined,
    searchQuery: searchQuery || undefined,
    limit,
  });

  return NextResponse.json({ articles });
}
