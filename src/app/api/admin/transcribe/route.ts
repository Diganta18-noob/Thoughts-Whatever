import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { toFile } from "groq-sdk";
import { guard } from "@/lib/admin-api";
import { getGroqClient, GROQ_WHISPER_MODEL, cleanMixedTranscription } from "@/lib/groq";
import { WHISPER_SUPPORTED_FORMATS, MAX_AUDIO_SIZE_MB } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Helper to create consistent error responses
 */
function errorResponse(message: string, code: string, status: number = 500) {
  console.error(`[Transcribe API] ${code}:`, message);
  return NextResponse.json(
    { ok: false, error: message, code },
    { status }
  );
}

export async function POST(request: NextRequest) {
  // 1. Authentication Check
  const gate = await guard();
  if ("response" in gate) {
    return errorResponse(
      "Authentication required. Your session may have expired. Please refresh and sign in again.",
      "AUTH_REQUIRED",
      401
    );
  }

  try {
    // 2. Parse Form Data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err) {
      return errorResponse(
        "Could not read upload data. File may be corrupted or too large.",
        "FORM_DATA_ERROR",
        400
      );
    }

    const file = formData.get("file") as File | null;
    const language = (formData.get("language") as string) || "bn";
    const storeAudio = formData.get("storeAudio") === "true";
    const autoClean = formData.get("autoClean") !== "false";

    // 3. File Validation
    if (!file) {
      return errorResponse(
        "No audio file provided. Please select an audio file and try again.",
        "NO_FILE",
        400
      );
    }

    if (!WHISPER_SUPPORTED_FORMATS.includes(file.type) && !file.name.match(/\.(mp3|m4a|wav|webm|ogg)$/i)) {
      return errorResponse(
        `Unsupported audio format: ${file.type || file.name}. Please use MP3, M4A, WAV, WebM, or OGG format.`,
        "INVALID_FORMAT",
        400
      );
    }

    const maxSize = MAX_AUDIO_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse(
        `Audio file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed size is ${MAX_AUDIO_SIZE_MB}MB. Please compress or split your audio file.`,
        "FILE_TOO_LARGE",
        400
      );
    }

    // 4. Check Groq API Configuration
    const groq = getGroqClient();
    if (!groq) {
      return errorResponse(
        "Groq transcription service not configured. Administrator needs to set GROQ_API_KEY in environment variables.",
        "NO_API_KEY",
        503
      );
    }

    // 5. Prepare Audio File Buffer
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (err) {
      return errorResponse(
        "Could not read audio file. File may be corrupted.",
        "FILE_READ_ERROR",
        400
      );
    }

    const buffer = Buffer.from(arrayBuffer);
    const whisperPrompt = "This narration is a mix of English quotes (e.g. 'Those who tell the stories rule the world', 'In the footsteps of history') and formal Bengali prose (বাংলা সাহিত্য, আনন্দমঠ, বঙ্কিমচন্দ্র চট্টোপাধ্যায়). Write English words in English script and Bengali in proper Bengali script. Do not transliterate English into Bengali letters.";

    let rawText = "";
    const providerName = "Groq Whisper Large v3 (Free & Ultra-Fast)";

    // 6. Transcribe using Groq Whisper Large v3
    try {
      console.log("[Transcribe] Initiating Groq Whisper transcription...");
      const groqFile = await toFile(buffer, file.name, { type: file.type || "audio/mpeg" });
      const transcription = await groq.audio.transcriptions.create({
        file: groqFile,
        model: GROQ_WHISPER_MODEL,
        language: language === "auto" ? undefined : language,
        prompt: whisperPrompt,
        temperature: 0.0,
      });
      rawText = transcription.text;
      console.log("[Transcribe] Groq transcription completed successfully");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Transcribe] Groq Whisper API error:", errMsg);

      if (errMsg.toLowerCase().includes("rate limit")) {
        return errorResponse(
          "Groq API rate limit reached (free tier). Please wait 30 seconds and click Retry.",
          "GROQ_RATE_LIMIT",
          429
        );
      }

      if (errMsg.toLowerCase().includes("unauthorized") || errMsg.toLowerCase().includes("invalid api key")) {
        return errorResponse(
          "Groq API key is invalid or expired. Administrator needs to update GROQ_API_KEY.",
          "GROQ_INVALID_KEY",
          401
        );
      }

      return errorResponse(
        `Groq transcription error: ${errMsg}`,
        "TRANSCRIPTION_FAILED",
        500
      );
    }

    if (!rawText) {
      return errorResponse(
        "No text could be generated from the audio file. Please check audio clarity.",
        "NO_TRANSCRIPTION",
        500
      );
    }

    // 7. AI Post-Processing Cleanup (Groq Llama-3.3-70b)
    let finalText = rawText;
    if (autoClean && rawText) {
      try {
        console.log("[Transcribe] Applying AI post-processing cleanup...");
        finalText = await cleanMixedTranscription(rawText);
      } catch (cleanErr) {
        console.warn("[Transcribe] AI cleanup failed (non-fatal, using raw text):", cleanErr);
      }
    }

    // 8. Optional Cloudinary Audio Storage
    let audioUrl: string | null = null;
    if (storeAudio && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        console.log("[Transcribe] Uploading audio to Cloudinary...");
        const dataUri = `data:${file.type || "audio/mpeg"};base64,${buffer.toString("base64")}`;

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
        console.log("[Transcribe] Audio uploaded to Cloudinary successfully");
      } catch (uploadErr) {
        console.warn("[Transcribe] Cloudinary upload failed (non-fatal):", uploadErr);
      }
    }

    console.log(`[Transcribe] Success: Groq Whisper, ${finalText.length} chars generated`);

    return NextResponse.json({
      ok: true,
      text: finalText,
      rawText,
      audioUrl,
      metadata: {
        provider: providerName,
        duration: 60,
        cost: 0.0,
        aiCleaned: autoClean && finalText !== rawText,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error occurred";
    console.error("[Transcribe] Unexpected error:", error);
    return errorResponse(
      `Unexpected error: ${message}. Please try again.`,
      "UNEXPECTED_ERROR",
      500
    );
  }
}
