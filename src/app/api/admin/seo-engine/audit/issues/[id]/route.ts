import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateIssueSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "IGNORED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requirePermission("audits", "manage");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status } = updateIssueSchema.parse(body);

    const updated = await prisma.technicalSEOIssue.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ issue: updated, success: true });
  } catch (error: any) {
    console.error("Update issue error:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update issue" },
      { status: 500 }
    );
  }
}
