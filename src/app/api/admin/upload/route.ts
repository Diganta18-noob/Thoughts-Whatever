import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { guard } from "@/lib/admin-api";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "thoughts-whatever";

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: "File must be an image (JPEG, PNG, WebP, etc.)" },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: "Image file size must be less than 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type || "image/webp"};base64,${base64}`;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Try Cloudinary upload if credentials are environment variables
    if (cloudName && apiKey && apiSecret) {
      try {
        // Sanitize cloud name if user entered dots instead of dashes
        const sanitizedCloudName = cloudName.replace(/\./g, "-");

        cloudinary.config({
          cloud_name: sanitizedCloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: folder,
          resource_type: "image",
          transformation: [
            { width: 2400, crop: "limit" },
            { quality: "auto:good" },
            { fetch_format: "auto" },
          ],
        });

        return NextResponse.json({
          ok: true,
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
        });
      } catch (cloudinaryErr: unknown) {
        const errMsg = cloudinaryErr instanceof Error ? cloudinaryErr.message : String(cloudinaryErr);
        console.warn("Cloudinary upload failed, using Data URI fallback:", errMsg);

        // Fallback: return dataUri when Cloudinary fails or credentials invalid
        return NextResponse.json({
          ok: true,
          url: dataUri,
          size: file.size,
          warning: "Cloudinary CDN upload unavailable; image stored locally as Data URI",
        });
      }
    }

    // Fallback: return dataUri when Cloudinary credentials are not set
    return NextResponse.json({
      ok: true,
      url: dataUri,
      size: file.size,
    });
  } catch (error: unknown) {
    console.error("Upload route error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
