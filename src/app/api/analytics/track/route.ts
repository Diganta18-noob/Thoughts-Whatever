import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Record analytics event
    return NextResponse.json({ success: true, event: body });
  } catch (e) {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
