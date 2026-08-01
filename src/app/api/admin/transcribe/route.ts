import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { guard } from "@/lib/admin-api";
import { openai, WHISPER_SUPPORTED_FORMATS, MAX_AUDIO_SIZE_MB } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes execution timeout for long audio files

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: language === "auto" ? undefined : language,
      response_format: "verbose_json",
      temperature: 0.0,
    });

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

    const duration = transcription.duration || 60;
    const cost = (duration / 60) * 0.006;

    return NextResponse.json({
      ok: true,
      text: transcription.text,
      audioUrl,
      metadata: {
        language: transcription.language,
        duration: Math.round(duration),
        segments: transcription.segments?.length || 0,
        cost: Number(cost.toFixed(4)),
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
