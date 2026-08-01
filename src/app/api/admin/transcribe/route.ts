import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { guard } from "@/lib/admin-api";
import { cleanMixedTranscription } from "@/lib/groq";
import { WHISPER_SUPPORTED_FORMATS, MAX_AUDIO_SIZE_MB } from "@/lib/openai";
import { resilientTranscribe, EngineError } from "@/lib/transcription-engine";

export const runtime = "nodejs";
export const maxDuration = 300;

function errorResponse(message: string, code: string, status: number = 500) {
  console.error(`[Transcribe API] ${code}:`, message);
  return NextResponse.json(
    { ok: false, error: message, code },
    { status }
  );
}

function uploadAudioToCloudinaryStream(
  buffer: Buffer,
  folder: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  timeoutMs = 4000
): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = (url: string | null) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(url);
      }
    };

    const timeout = setTimeout(() => {
      console.warn("[Transcribe] Cloudinary audio upload timed out after", timeoutMs, "ms");
      safeResolve(null);
    }, timeoutMs);

    try {
      const sanitizedCloudName = cloudName.replace(/\./g, "-");
      cloudinary.config({
        cloud_name: sanitizedCloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            console.warn("[Transcribe] Cloudinary upload stream error:", error?.message || "No secure URL");
            safeResolve(null);
          } else {
            safeResolve(result.secure_url);
          }
        }
      );

      uploadStream.on("error", (err) => {
        console.warn("[Transcribe] Cloudinary uploadStream event error:", err);
        safeResolve(null);
      });

      const stream = Readable.from(buffer);
      stream.on("error", (err) => {
        console.warn("[Transcribe] Readable stream error:", err);
        safeResolve(null);
      });

      stream.pipe(uploadStream);
    } catch (err) {
      console.warn("[Transcribe] Cloudinary stream setup error:", err);
      safeResolve(null);
    }
  });
}

export async function POST(request: NextRequest) {
  const gate = await guard();
  if ("response" in gate) {
    return errorResponse(
      "Authentication required. Your session may have expired. Please refresh and sign in again.",
      "AUTH_REQUIRED",
      401
    );
  }

  try {
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
    // ─── Resilient Transcription Engine ────────────────────────────────
    // Automatically tries OpenRouter → Groq → OpenAI with retry,
    // exponential backoff, circuit breaker, and real-time event logging.
    let rawText = "";
    let providerName = "";
    let eventLog: Array<{ timestamp: string; provider: string; action: string; message: string; durationMs?: number; isAutoFix?: boolean }> = [];
    let recoveryAttempts = 0;
    let autoFixed = false;

    try {
      const result = await resilientTranscribe(
        buffer,
        file.name || "narration.mp3",
        file.type || "audio/mpeg",
        language,
        whisperPrompt
      );

      rawText = result.text;
      providerName = result.provider;
      eventLog = result.eventLog;
      recoveryAttempts = result.recoveryAttempts;
      autoFixed = result.autoFixed;
    } catch (err: unknown) {
      if (err instanceof EngineError) {
        return NextResponse.json(
          {
            ok: false,
            error: err.message,
            code: err.code,
            eventLog: err.eventLog,
          },
          { status: err.status }
        );
      }
      const message = err instanceof Error ? err.message : String(err);
      return errorResponse(`Transcription error: ${message}`, "TRANSCRIPTION_FAILED", 500);
    }

    if (!rawText) {
      return errorResponse(
        "No text could be generated from the audio file. Please check audio clarity.",
        "NO_TRANSCRIPTION",
        500
      );
    }

    // 2. Fast AI Post-Processing Cleanup (Groq Llama-3.3-70b)
    let finalText = rawText;
    if (autoClean && rawText) {
      try {
        finalText = await cleanMixedTranscription(rawText);
      } catch (cleanErr) {
        console.warn("[Transcribe] AI cleanup skipped (using raw text):", cleanErr);
      }
    }

    // 3. Optional Streamed Non-Blocking Cloudinary Storage
    let audioUrl: string | null = null;
    const rawCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (storeAudio && rawCloudName && apiKey && apiSecret) {
      try {
        audioUrl = await uploadAudioToCloudinaryStream(
          buffer,
          "thoughts-whatever/audio",
          rawCloudName,
          apiKey,
          apiSecret,
          4000
        );
      } catch (uploadErr) {
        console.warn("[Transcribe] Cloudinary stream upload failed (non-fatal):", uploadErr);
      }
    }

    console.log(`[Transcribe] Success: ${providerName}, ${finalText.length} chars generated`);

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
        eventLog,
        recoveryAttempts,
        autoFixed,
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
