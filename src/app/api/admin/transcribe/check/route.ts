import { NextResponse } from "next/server";
import { guard } from "@/lib/admin-api";
import { getGroqClient } from "@/lib/groq";

export const runtime = "nodejs";

/**
 * Pre-flight health check endpoint for transcription service.
 * Returns configuration status without attempting transcription.
 */
export async function GET() {
  // Check authentication
  const gate = await guard();
  if ("response" in gate) {
    return NextResponse.json(
      {
        ok: false,
        error: "Authentication required. Please sign in to use transcription.",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    );
  }

  try {
    const groq = getGroqClient();

    if (!groq) {
      return NextResponse.json(
        {
          ok: false,
          error: "Groq transcription service not configured. Administrator needs to set GROQ_API_KEY in environment variables.",
          code: "NO_API_KEY",
          details: {
            groqConfigured: false,
          },
        },
        { status: 503 }
      );
    }

    // Service is available
    return NextResponse.json({
      ok: true,
      provider: "Groq Whisper Large v3",
      message: "Groq Whisper available (free & ultra-fast)",
    });
  } catch (error) {
    console.error("Transcription health check error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Service check failed. Please try again.",
        code: "CHECK_FAILED",
      },
      { status: 500 }
    );
  }
}
