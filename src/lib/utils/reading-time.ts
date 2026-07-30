export function calculateReadingTime(text: string): number {
  if (!text) return 1;
  // Bengali reading speed is approximately 180-200 words per minute
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 180);
  return Math.max(1, minutes);
}
