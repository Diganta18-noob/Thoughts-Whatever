import Groq from "groq-sdk";

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Groq({ apiKey });
}

export const GROQ_WHISPER_MODEL = "whisper-large-v3";
