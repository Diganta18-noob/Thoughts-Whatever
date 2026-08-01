import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { guard } from "@/lib/admin-api";
import { getOpenAIClient, WHISPER_SUPPORTED_FORMATS, MAX_AUDIO_SIZE_MB } from "@/lib/openai";
import { getGroqClient, GROQ_WHISPER_MODEL } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const language = (formData.get("language") as string) || "bn";
    const storeAudio = formData.get("storeAudio") === "true";

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (!WHISPER_SUPPORTED_FORMATS.includes(file.type) && !file.name.match(/\.(mp3|m4a|wav|webm|ogg)$/i)) {
      return NextResponse.json(
        { ok: false, error: "Unsupported audio format. Use MP3, M4A, WAV, WebM, or OGG." },
        { status: 400 }
      );
    }

    const maxSize = MAX_AUDIO_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: `Audio file must be under ${MAX_AUDIO_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    const groq = getGroqClient();
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

    if (!groq && !hasOpenAI) {
      return NextResponse.json(
        {
          ok: false,
          error: "No transcription API key configured. Add GROQ_API_KEY (free & ultra-fast) or OPENAI_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    let transcribedText = "";
    let providerName = "";
    let durationSeconds = 60;

    // Use Groq Whisper Large v3 (ultra-fast & free) if available, otherwise OpenAI
    if (groq) {
      providerName = "Groq Whisper Large v3 (Free & Ultra-Fast)";
      const transcription = await groq.audio.transcriptions.create({
        file,
        model: GROQ_WHISPER_MODEL,
        language: language === "auto" ? undefined : language,
        temperature: 0.0,
      });
      transcribedText = transcription.text;
    } else {
      providerName = "OpenAI Whisper-1";
      const openai = getOpenAIClient();
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: language === "auto" ? undefined : language,
        response_format: "verbose_json",
        temperature: 0.0,
      });
      transcribedText = transcription.text;
      durationSeconds = transcription.duration || 60;
    }

    let audioUrl: string | null = null;

    // Store audio in Cloudinary if requested
    if (storeAudio && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const dataUri = `data:${file.type || "audio/mpeg"};base64,${base64}`;

        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "thoughts-whatever/audio",
          resource_type: "video",
        });

        audioUrl = result.secure_url;
      } catch (uploadErr) {
        console.warn("Audio upload to Cloudinary failed, returning transcription text only:", uploadErr);
      }
    }

    const estimatedCost = groq ? 0.0 : (durationSeconds / 60) * 0.006;

    return NextResponse.json({
      ok: true,
      text: transcribedText,
      audioUrl,
      metadata: {
        provider: providerName,
        duration: Math.round(durationSeconds),
        cost: Number(estimatedCost.toFixed(4)),
      },
    });
  } catch (error: unknown) {
    console.error("Transcription API error:", error);
    const message = error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
