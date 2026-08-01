import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { toFile } from "groq-sdk";
import { Readable } from "stream";
import { guard } from "@/lib/admin-api";
import { getGroqClient, GROQ_WHISPER_MODEL, cleanMixedTranscription } from "@/lib/groq";
import { getOpenAIClient, WHISPER_SUPPORTED_FORMATS, MAX_AUDIO_SIZE_MB } from "@/lib/openai";

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
async function transcribeWithOpenRouter(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  openRouterKey: string,
  prompt: string
): Promise<string> {
  const base64Data = buffer.toString("base64");
  const mediaType = mimeType || "audio/mpeg";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey.trim()}`,
        "HTTP-Referer": "https://thoughts-whatever.vercel.app",
        "X-Title": "Thoughts Whatever Journal",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [
          {
            role: "system",
            content: `${prompt}\nYour task is to transcribe audio into accurate Markdown text. English quotes must remain in English script, and Bengali in proper Bengali script. Output ONLY the verbatim text script.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcribe this audio narration accurately into text:",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        temperature: 0.0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter returned status ${res.status}: ${errText.substring(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("No transcription text returned from OpenRouter AI");
    }
    return text;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
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

    let rawText = "";
    let providerName = "";

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const groq = getGroqClient();
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

    if (openRouterKey && openRouterKey.trim() !== "") {
      try {
        console.log("[Transcribe] Initiating OpenRouter AI transcription...");
        rawText = await transcribeWithOpenRouter(
          buffer,
          file.name || "narration.mp3",
          file.type || "audio/mpeg",
          openRouterKey,
          whisperPrompt
        );
        providerName = "OpenRouter AI";
        console.log("[Transcribe] OpenRouter AI completed successfully");
      } catch (openRouterErr: unknown) {
        const errMsg = openRouterErr instanceof Error ? openRouterErr.message : String(openRouterErr);
        console.warn("[Transcribe] OpenRouter AI failed:", errMsg);

        if (groq) {
          try {
            console.log("[Transcribe] Fallback to Groq Whisper...");
            const groqFile = await toFile(buffer, file.name || "narration.mp3", { type: file.type || "audio/mpeg" });
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000);

            const transcription = await groq.audio.transcriptions.create(
              {
                file: groqFile,
                model: GROQ_WHISPER_MODEL,
                language: language === "auto" ? undefined : language,
                prompt: whisperPrompt,
                temperature: 0.0,
              },
              { signal: controller.signal }
            );

            clearTimeout(timeout);
            rawText = transcription.text;
            providerName = "Groq Whisper Large v3 (Fallback)";
          } catch (groqErr) {
            console.warn("[Transcribe] Groq fallback failed:", groqErr);
          }
        }
      }
    }

    if (!rawText && groq) {
      try {
        console.log("[Transcribe] Initiating Groq Whisper transcription...");
        const groqFile = await toFile(buffer, file.name || "narration.mp3", { type: file.type || "audio/mpeg" });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        const transcription = await groq.audio.transcriptions.create(
          {
            file: groqFile,
            model: GROQ_WHISPER_MODEL,
            language: language === "auto" ? undefined : language,
            prompt: whisperPrompt,
            temperature: 0.0,
          },
          { signal: controller.signal }
        );

        clearTimeout(timeout);
        rawText = transcription.text;
        providerName = "Groq Whisper Large v3 (Free & Ultra-Fast)";
        console.log("[Transcribe] Groq Whisper completed successfully");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn("[Transcribe] Groq Whisper API error:", errMsg);

        if (hasOpenAI) {
          console.log("[Transcribe] Attempting OpenAI Whisper fallback...");
          try {
            const openai = getOpenAIClient();
            const openaiFile = await toFile(buffer, file.name || "narration.mp3", { type: file.type || "audio/mpeg" });
            const transcription = await openai.audio.transcriptions.create({
              file: openaiFile,
              model: "whisper-1",
              language: language === "auto" ? undefined : language,
              prompt: whisperPrompt,
              temperature: 0.0,
            });
            rawText = transcription.text;
            providerName = "OpenAI Whisper-1 (Fallback)";
          } catch (openaiErr) {
            console.error("[Transcribe] OpenAI Whisper fallback failed:", openaiErr);
          }
        }

        if (!rawText) {
          if (errMsg.toLowerCase().includes("rate limit")) {
            return errorResponse(
              "Groq API rate limit reached. Please wait 30 seconds and click Retry.",
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
            `Transcription error: ${errMsg}`,
            "TRANSCRIPTION_FAILED",
            500
          );
        }
      }
    } else if (!rawText && hasOpenAI) {
      try {
        console.log("[Transcribe] Using OpenAI Whisper...");
        const openai = getOpenAIClient();
        const openaiFile = await toFile(buffer, file.name || "narration.mp3", { type: file.type || "audio/mpeg" });
        const transcription = await openai.audio.transcriptions.create({
          file: openaiFile,
          model: "whisper-1",
          language: language === "auto" ? undefined : language,
          prompt: whisperPrompt,
          temperature: 0.0,
        });
        rawText = transcription.text;
        providerName = "OpenAI Whisper-1";
      } catch (openaiErr: unknown) {
        const message = openaiErr instanceof Error ? openaiErr.message : String(openaiErr);
        return errorResponse(
          `OpenAI Whisper error: ${message}`,
          "TRANSCRIPTION_FAILED",
          500
        );
      }
    } else if (!rawText) {
      return errorResponse(
        "No transcription service configured. Administrator needs to set OPENROUTER_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in environment variables.",
        "NO_API_KEY",
        503
      );
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
