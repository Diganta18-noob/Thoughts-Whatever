import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { getWebsites, createWebsite } from "@/lib/seo-engine/websites";
import { z } from "zod";

const createWebsiteSchema = z.object({
  name: z.string().min(2, "Website name must be at least 2 characters"),
  domain: z.string().min(3, "Domain is required"),
  homepageUrl: z.string().url("Must be a valid URL"),
  niche: z.string().min(2, "Niche/Industry is required"),
  targetCountry: z.string().default("US"),
  targetLanguage: z.string().default("en"),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const websites = await getWebsites();
    return NextResponse.json({ websites });
  } catch (error: any) {
    console.error("Error fetching websites:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch websites" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requirePermission("websites", "create");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden: Missing permissions to create websites" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = createWebsiteSchema.parse(body);

    const website = await createWebsite(validated);
    return NextResponse.json({ website, success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating website:", error);
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to create website" },
      { status: 500 }
    );
  }
}
