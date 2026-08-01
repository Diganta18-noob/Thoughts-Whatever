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
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const groq = getGroqClient();

  const systemPrompt = `You are an expert Bengali-English editor and proofreader for a high-end Bengali literary journal ("Thoughts Whatever").
Your task is to clean and refine raw audio transcriptions that mix English quotes/phrases with formal Bengali narration:
1. Convert any English phrases or quotes phonetically transcribed into Bengali script back into proper English Latin script (e.g., "দোজ কু টেল দে স্টোরিস" -> "Those who tell the stories", "ইন দে ফুস্টেপ্স আফ হিস্ট্রি" -> "In the footsteps of history").
2. Correct Bengali spelling, typos, and conjuncts (e.g., "আনন্দমট" -> "আনন্দমঠ", "সন্নাশি" -> "সন্ন্যাসী", "পান্কিম চন্ছু" -> "বঙ্কিমচন্দ্র", "ইতযাশ" -> "ইতিহাস").
3. Properly format the text into clean, readable paragraphs with standard punctuation (commas, Bengali darris '।', and quotation marks).
4. Do NOT change the speaker's original meaning or omit content.
5. Output ONLY the polished output text. Do not add intro/outro commentary like "Here is the cleaned text:".`;

  // 1. Try OpenRouter Claude if key is configured
  if (openRouterKey && openRouterKey.trim() !== "") {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch("https://agentrouter.org/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey.trim()}`,
          "HTTP-Referer": "https://thoughts-whatever.vercel.app",
          "X-Title": "Thoughts Whatever Journal",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: rawText },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const cleaned = data.choices?.[0]?.message?.content?.trim();
        if (cleaned) {
          console.log("[Agent Router] Claude 3.5 Sonnet cleaned transcription successfully");
          return cleaned;
        }
      }
    } catch (err) {
      console.warn("[Agent Router] Claude cleanup failed or timed out, trying fallback:", err);
    }
  }

  // 2. Try Groq Llama 3.3 70B if Groq client is available
  if (groq) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await groq.chat.completions.create(
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: rawText },
          ],
          temperature: 0.1,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);
      return response.choices[0]?.message?.content?.trim() || rawText;
    } catch (err) {
      console.warn("[Groq] AI cleanup failed or timed out, returning raw transcription:", err);
    }
  }

  return rawText;
}
