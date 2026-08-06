import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { autoMatchAndSyncReels } from "../../../../../scripts/sync-instagram-reels";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  try {
    const body = await req.json().catch(() => ({}));
    const feed = body.reels || [
      {
        reelUrl: "https://www.instagram.com/reel/Da-qp65A20l/",
        caption: "মেঘনাদবধ কাব্য পর্ব-১ | ঘরের শত্রু বিভীষণ",
        episodeOrder: 1,
        seriesSlug: "মেঘনাদবধ-কাব্য",
      },
    ];

    const updatedCount = await autoMatchAndSyncReels(feed);

    return NextResponse.json({
      ok: true,
      message: `Successfully auto-synced ${updatedCount} Instagram Reel links.`,
      updatedCount,
    });
  } catch (error) {
    console.error("Error auto-syncing Instagram Reels:", error);
    return NextResponse.json(
      { error: "Failed to auto-sync Instagram Reels" },
      { status: 500 }
    );
  }
}
