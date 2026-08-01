import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { toFile } from "groq-sdk";
import { toFile as openAiToFile } from "openai";
import { guard } from "@/lib/admin-api";
import { getOpenAIClient, WHISPER_SUPPORTED_FORMATS, MAX_AUDIO_SIZE_MB } from "@/lib/openai";
import { getGroqClient, GROQ_WHISPER_MODEL, cleanMixedTranscription } from "@/lib/groq";

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
    const autoClean = formData.get("autoClean") !== "false";

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No audio file provided. Please select an audio file." },
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
        { ok: false, error: `Audio file size must be under ${MAX_AUDIO_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    const groq = getGroqClient();
    const openai = getOpenAIClient();

    if (!groq && !openai) {
      return NextResponse.json(
        {
          ok: false,
          error: "No transcription API key configured. Please set GROQ_API_KEY or OPENAI_API_KEY in your environment variables.",
        },
        { status: 500 }
      );
    }

    let rawText = "";
    let providerName = "";
    let durationSeconds = 60;

    const whisperPrompt = "This narration is a mix of English quotes (e.g. 'Those who tell the stories rule the world', 'In the footsteps of history') and formal Bengali prose (বাংলা সাহিত্য, আনন্দমঠ, বঙ্কিমচন্দ্র চট্টোপাধ্যায়). Write English words in English script and Bengali in proper Bengali script. Do not transliterate English into Bengali letters.";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let groqError: string | null = null;

    // 1. Try Groq Whisper Large v3 (ultra-fast & free) if available
    if (groq) {
      try {
        providerName = "Groq Whisper Large v3 (Free & Ultra-Fast)";
        const groqFile = await toFile(buffer, file.name, { type: file.type || "audio/mpeg" });
        const transcription = await groq.audio.transcriptions.create({
          file: groqFile,
          model: GROQ_WHISPER_MODEL,
          language: language === "auto" ? undefined : language,
          prompt: whisperPrompt,
          temperature: 0.0,
        });
        rawText = transcription.text;
      } catch (err: unknown) {
        console.warn("Groq transcription failed, checking OpenAI fallback:", err);
        groqError = err instanceof Error ? err.message : String(err);
      }
    }

    // 2. Fallback to OpenAI Whisper-1 if Groq failed or is missing
    if (!rawText && openai) {
      try {
        providerName = "OpenAI Whisper-1";
        const openAiFile = await openAiToFile(buffer, file.name, { type: file.type || "audio/mpeg" });
        const transcription = await openai.audio.transcriptions.create({
          file: openAiFile,
          model: "whisper-1",
          language: language === "auto" ? undefined : language,
          prompt: whisperPrompt,
          response_format: "verbose_json",
          temperature: 0.0,
        });
        rawText = transcription.text;
        durationSeconds = transcription.duration || 60;
      } catch (openAiErr: unknown) {
        console.error("OpenAI transcription error:", openAiErr);
        const openAiMsg = openAiErr instanceof Error ? openAiErr.message : String(openAiErr);
        return NextResponse.json(
          {
            ok: false,
            error: `Transcription failed: ${openAiMsg}${groqError ? ` (Groq error: ${groqError})` : ""}`,
          },
          { status: 500 }
        );
      }
    }

    if (!rawText) {
      return NextResponse.json(
        {
          ok: false,
          error: `Transcription failed. ${groqError ? `Groq error: ${groqError}.` : ""} Please check your GROQ_API_KEY or OPENAI_API_KEY in Vercel settings.`,
        },
        { status: 500 }
      );
    }

    // Auto-fix phonetic transliteration and Bengali typos using Groq Llama-3.3-70b
    let finalText = rawText;
    if (autoClean && rawText) {
      finalText = await cleanMixedTranscription(rawText);
    }

    let audioUrl: string | null = null;

    // Store audio in Cloudinary if requested
    if (storeAudio && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
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
      } catch (uploadErr) {
        console.warn("Audio upload to Cloudinary failed, returning transcription text only:", uploadErr);
      }
    }

    const estimatedCost = providerName.includes("Groq") ? 0.0 : (durationSeconds / 60) * 0.006;

    return NextResponse.json({
      ok: true,
      text: finalText,
      rawText,
      audioUrl,
      metadata: {
        provider: providerName,
        duration: Math.round(durationSeconds),
        cost: Number(estimatedCost.toFixed(4)),
        aiCleaned: autoClean && finalText !== rawText,
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
