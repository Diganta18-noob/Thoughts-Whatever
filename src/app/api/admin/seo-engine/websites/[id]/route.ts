import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { getWebsiteById, updateWebsite, deleteWebsite } from "@/lib/seo-engine/websites";
import { z } from "zod";

const updateWebsiteSchema = z.object({
  name: z.string().min(2).optional(),
  domain: z.string().min(3).optional(),
  homepageUrl: z.string().url().optional(),
  niche: z.string().min(2).optional(),
  targetCountry: z.string().optional(),
  targetLanguage: z.string().optional(),
  isDefault: z.boolean().optional(),
  gscConnected: z.boolean().optional(),
  gaConnected: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const website = await getWebsiteById(params.id);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }
    return NextResponse.json({ website });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch website" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requirePermission("websites", "update");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = updateWebsiteSchema.parse(body);

    const updated = await updateWebsite(params.id, validated);
    return NextResponse.json({ website: updated, success: true });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to update website" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requirePermission("websites", "delete");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await deleteWebsite(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete website" },
      { status: 400 }
    );
  }
}
