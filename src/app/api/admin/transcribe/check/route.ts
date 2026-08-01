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
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim() !== "");
    const groq = getGroqClient();
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

    if (!hasOpenRouter && !groq && !hasOpenAI) {
      return NextResponse.json(
        {
          ok: false,
          error: "Transcription service not configured. Administrator needs to set OPENROUTER_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in environment variables.",
          code: "NO_API_KEY",
          details: {
            openRouterConfigured: false,
            groqConfigured: false,
            openAIConfigured: false,
          },
        },
        { status: 503 }
      );
    }

    const provider = hasOpenRouter
      ? "OpenRouter AI (Claude 3.5 Sonnet / Gemini)"
      : groq
      ? "Groq Whisper Large v3"
      : "OpenAI Whisper-1";

    return NextResponse.json({
      ok: true,
      provider,
      message: `${provider} ready`,
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
