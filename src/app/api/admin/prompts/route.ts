import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promptInputSchema, flattenIssues } from "@/lib/validation";

// Auth helper: Checks for JWT Cookie OR Bearer PROMPT_API_KEY header
async function authorize(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const expectedKey = process.env.PROMPT_API_KEY;
    if (expectedKey && token === expectedKey) {
      return { authorized: true, adminId: null, authType: "api_key" };
    }
  }

  const admin = await requireAdmin();
  if (admin) {
    return { authorized: true, adminId: admin.id, authType: "cookie" };
  }

  return { authorized: false, adminId: null, authType: "none" };
}

export async function GET(req: Request) {
  const auth = await authorize(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const source = searchParams.get("source") || undefined;
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const tag = searchParams.get("tag") || undefined;
  const isExport = searchParams.get("export");

  const where: any = {};

  if (source) where.source = source;
  if (status) where.status = status;
  if (category) where.category = category;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { text: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { linkedTo: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  try {
    if (isExport === "json") {
      const prompts = await prisma.promptLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 2000,
      });

      return new Response(JSON.stringify(prompts, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="prompts-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }

    if (isExport === "markdown") {
      const prompts = await prisma.promptLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 2000,
      });

      const mdSections = prompts.map((p) => {
        const title = p.summary || p.text.slice(0, 50) + "...";
        const dateStr = p.createdAt.toISOString().split("T")[0];
        const tagsStr = p.tags.length > 0 ? p.tags.join(", ") : "none";
        return `### ${title}
**Source**: ${p.source} | **Category**: ${p.category} | **Status**: ${p.status} | **Date**: ${dateStr}  
**Tags**: ${tagsStr}${p.linkedTo ? ` | **Linked To**: ${p.linkedTo}` : ""}

> ${p.text.replace(/\n/g, "\n> ")}

${p.notes ? `**Notes**: ${p.notes}\n` : ""}---`;
      });

      const fullMarkdown = `# Prompt Library Export (${new Date().toISOString().split("T")[0]})\n\n` + mdSections.join("\n\n");

      return new Response(fullMarkdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="prompts-${new Date().toISOString().split("T")[0]}.md"`,
        },
      });
    }

    const [prompts, total, sourcesRaw, statusesRaw, categoriesRaw, statsByStatus] = await Promise.all([
      prisma.promptLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.promptLog.count({ where }),
      prisma.promptLog.groupBy({ by: ["source"], _count: true }),
      prisma.promptLog.groupBy({ by: ["status"], _count: true }),
      prisma.promptLog.groupBy({ by: ["category"], _count: true }),
      prisma.promptLog.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      prompts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats: {
        total,
        sources: sourcesRaw.map((s) => ({ source: s.source, count: s._count })),
        statuses: statusesRaw.map((st) => ({ status: st.status, count: st._count })),
        categories: categoriesRaw.map((c) => ({ category: c.category, count: c._count })),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/prompts error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await authorize(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = promptInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: flattenIssues(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const prompt = await prisma.promptLog.create({
      data: {
        text: data.text,
        summary: data.summary || null,
        source: data.source,
        category: data.category,
        status: data.status,
        tags: data.tags,
        linkedTo: data.linkedTo || null,
        notes: data.notes || null,
        adminId: auth.adminId || undefined,
      },
    });

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error("POST /api/admin/prompts error:", error);
    return NextResponse.json({ success: false, error: "Failed to create prompt" }, { status: 500 });
  }
}
