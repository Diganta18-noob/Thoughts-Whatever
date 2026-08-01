import Groq from "groq-sdk";

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.warn("[Groq] GROQ_API_KEY is not configured in environment variables");
    return null;
  }
  return new Groq({ apiKey });
}

export const GROQ_WHISPER_MODEL = "whisper-large-v3";

export async function cleanMixedTranscription(rawText: string): Promise<string> {
  const groq = getGroqClient();
  if (!groq) return rawText;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert Bengali-English editor and proofreader for a high-end Bengali literary journal ("Thoughts Whatever").
Your task is to clean and refine raw audio transcriptions that mix English quotes/phrases with formal Bengali narration:
1. Convert any English phrases or quotes phonetically transcribed into Bengali script back into proper English Latin script (e.g., "দোজ কু টেল দে স্টোরিস" -> "Those who tell the stories", "ইন দে ফুস্টেপ্স আফ হিস্ট্রি" -> "In the footsteps of history").
2. Correct Bengali spelling, typos, and conjuncts (e.g., "আনন্দমট" -> "আনন্দমঠ", "সন্নাশি" -> "সন্ন্যাসী", "পান্কিম চন্ছু" -> "বঙ্কিমচন্দ্র", "ইতযাশ" -> "ইতিহাস").
3. Properly format the text into clean, readable paragraphs with standard punctuation (commas, Bengali darris '।', and quotation marks).
4. Do NOT change the speaker's original meaning or omit content.
5. Output ONLY the polished output text. Do not add intro/outro commentary like "Here is the cleaned text:".`,
        },
        {
          role: "user",
          content: rawText,
        },
      ],
      temperature: 0.1,
    });

    return response.choices[0]?.message?.content?.trim() || rawText;
  } catch (err) {
    console.warn("[Groq] AI post-processing cleanup failed, returning raw transcription:", err);
    return rawText;
  }
}
