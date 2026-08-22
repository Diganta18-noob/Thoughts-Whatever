import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
} from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const severity = searchParams.get("severity") || undefined;
  const type = searchParams.get("type") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const data = await getNotifications({
    adminUserId: admin.id,
    unreadOnly,
    severity,
    type,
    limit,
  });

  return NextResponse.json({ ok: true, ...data });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.action === "mark_all_read") {
      await markAllNotificationsAsRead(admin.id);
      return NextResponse.json({ ok: true, message: "All notifications marked as read" });
    }

    if (body.id) {
      await markNotificationAsRead(body.id);
      return NextResponse.json({ ok: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
  }

  try {
    await deleteNotification(id);
    return NextResponse.json({ ok: true, message: "Notification deleted" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const notification = await createNotification({
      type: body.type || "info",
      severity: body.severity || "info",
      title: body.title,
      message: body.message,
      actionUrl: body.actionUrl,
      metadata: body.metadata,
      adminUserId: body.adminUserId,
    });

    return NextResponse.json({ ok: true, notification });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
