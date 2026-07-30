import { NextResponse } from "next/server";
import { MOCK_ARTICLES } from "@/lib/mock-data";
import { Article } from "@/types/database";

export async function POST(request: Request) {
  try {
    const articleData: Article = await request.json();
    MOCK_ARTICLES.unshift(articleData);
    return NextResponse.json({ success: true, article: articleData });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save article" }, { status: 500 });
  }
}
