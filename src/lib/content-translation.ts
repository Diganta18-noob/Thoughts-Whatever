export const normalizeTranslationText = (text: string) => text.replace(/\s+/g, " ").trim();
export const needsEnglishTranslation = (text: string) => /[\u0980-\u09ff]/.test(text);

export function validateTranslations(texts: string[], value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid translation response");
  const result: Record<string, string> = {};
  texts.forEach((text, index) => {
    const translated = (value as Record<string, unknown>)[String(index)];
    if (typeof translated !== "string" || !translated.trim() || needsEnglishTranslation(translated)) {
      throw new Error("Incomplete English translation");
    }
    result[text] = translated.trim();
  });
  return result;
}
