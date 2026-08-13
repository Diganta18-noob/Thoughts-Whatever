import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { promptUpdateSchema, flattenIssues } from "@/lib/validation";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const prompt = await prisma.promptLog.findUnique({
      where: { id },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error("GET /api/admin/prompts/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const parsed = promptUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: flattenIssues(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.promptLog.update({
      where: { id },
      data: {
        ...(data.text && { text: data.text }),
        ...(data.summary !== undefined && { summary: data.summary || null }),
        ...(data.source && { source: data.source }),
        ...(data.category && { category: data.category }),
        ...(data.status && { status: data.status }),
        ...(data.tags && { tags: data.tags }),
        ...(data.linkedTo !== undefined && { linkedTo: data.linkedTo || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });

    return NextResponse.json({ success: true, prompt: updated });
  } catch (error) {
    console.error("PATCH /api/admin/prompts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    await prisma.promptLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/prompts/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}
