import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.");
  }
  return new OpenAI({ apiKey });
}

export const WHISPER_SUPPORTED_FORMATS = [
  "audio/mpeg",  // .mp3
  "audio/mp4",   // .m4a
  "audio/wav",   // .wav
  "audio/webm",  // .webm
  "audio/ogg",   // .ogg
  "audio/x-m4a",
];

export const MAX_AUDIO_SIZE_MB = 25; // Whisper API max file size limit
