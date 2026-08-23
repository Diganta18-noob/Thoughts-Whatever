import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await prisma.webhook.findMany({
    include: {
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, webhooks });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, webhookId, name, url, events, active } = body;

    // Test webhook delivery
    if (action === "test") {
      if (!webhookId) {
        return NextResponse.json({ ok: false, error: "Missing webhookId" }, { status: 400 });
      }
      const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
      if (!webhook) {
        return NextResponse.json({ ok: false, error: "Webhook not found" }, { status: 404 });
      }

      const testPayload = {
        event: "test.ping",
        timestamp: new Date().toISOString(),
        data: { message: "Test payload from Thoughts Whatever Editor's Room" },
      };

      const start = performance.now();
      let status = "SUCCESS";
      let statusCode = 200;
      let responseBody = "";

      try {
        const signature = crypto
          .createHmac("sha256", webhook.secret)
          .update(JSON.stringify(testPayload))
          .digest("hex");

        const res = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Thoughts-Signature": signature,
            "User-Agent": "Thoughts-Whatever-Webhook/1.0",
          },
          body: JSON.stringify(testPayload),
        });
        statusCode = res.status;
        responseBody = await res.text().catch(() => "");
        if (!res.ok) status = "FAILED";
      } catch (err: any) {
        status = "FAILED";
        responseBody = err.message;
        statusCode = 500;
      }

      const durationMs = Math.round(performance.now() - start);

      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event: "test.ping",
          payload: testPayload,
          statusCode,
          responseBody: responseBody.slice(0, 500),
          durationMs,
          status,
        },
      });

      return NextResponse.json({ ok: status === "SUCCESS", delivery });
    }

    // Create webhook
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: false, error: "Name, URL and at least one event are required" }, { status: 400 });
    }

    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        secret,
        events,
        active: active !== false,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.nameBn ?? "Admin",
        action: "WEBHOOK_CREATED",
        entityType: "Webhook",
        entityId: webhook.id,
        summary: `Registered webhook "${webhook.name}" for events: ${events.join(", ")}`,
        severity: "info",
      },
    });

    return NextResponse.json({ ok: true, webhook });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing webhook ID" }, { status: 400 });
    }

    await prisma.webhook.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.nameBn ?? "Admin",
        action: "WEBHOOK_DELETED",
        entityType: "Webhook",
        entityId: id,
        summary: `Deleted webhook ${id}`,
        severity: "warning",
      },
    });

    return NextResponse.json({ ok: true, message: "Webhook deleted" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
