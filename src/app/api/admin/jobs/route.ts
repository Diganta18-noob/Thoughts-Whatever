import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_JOBS = [
  {
    name: "Nightly Backup & Sync",
    description: "Executes full PostgreSQL database dump, upload to Cloudflare R2, and catalog sync.",
    schedule: "0 1 * * *",
    status: "IDLE" as const,
    enabled: true,
  },
  {
    name: "Automated SEO & Link Integrity Scan",
    description: "Scans all published articles for broken links, heading depth, missing meta, and duplicate titles.",
    schedule: "0 3 * * *",
    status: "IDLE" as const,
    enabled: true,
  },
  {
    name: "Analytics & Reading Aggregation",
    description: "Aggregates milestone reading scroll depths, session milestones, and daily active reader counts.",
    schedule: "*/30 * * * *",
    status: "IDLE" as const,
    enabled: true,
  },
  {
    name: "Media Usage Verification",
    description: "Audits Cloudinary asset usage across pieces, author portraits, and series banners to identify unused media.",
    schedule: "0 6 * * 0",
    status: "IDLE" as const,
    enabled: true,
  },
  {
    name: "Sitemap & RSS Regeneration",
    description: "Revalidates sitemap.xml and feeds to ensure search engines receive fresh published pieces.",
    schedule: "0 */4 * * *",
    status: "IDLE" as const,
    enabled: true,
  },
];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Seed default jobs if none exist
  const existingCount = await prisma.scheduledJob.count();
  if (existingCount === 0) {
    for (const job of DEFAULT_JOBS) {
      await prisma.scheduledJob.create({ data: job }).catch(() => {});
    }
  }

  const jobs = await prisma.scheduledJob.findMany({
    include: {
      executions: {
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, jobs });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, jobId, name, description, schedule, enabled } = body;

    if (action === "create") {
      if (!name || !schedule) {
        return NextResponse.json({ ok: false, error: "Name and schedule are required" }, { status: 400 });
      }
      const newJob = await prisma.scheduledJob.create({
        data: {
          name,
          description,
          schedule,
          enabled: enabled !== false,
        },
      });
      return NextResponse.json({ ok: true, job: newJob });
    }

    if (action === "toggle") {
      if (!jobId) {
        return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });
      }
      const existing = await prisma.scheduledJob.findUnique({ where: { id: jobId } });
      if (!existing) {
        return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
      }
      const updated = await prisma.scheduledJob.update({
        where: { id: jobId },
        data: {
          enabled: !existing.enabled,
          status: !existing.enabled ? "IDLE" : "PAUSED",
        },
      });
      return NextResponse.json({ ok: true, job: updated });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
