export function slugifyBengali(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0980-\u09FF\s-]/g, "") // Keep alphanumeric, Bengali characters, spaces, hyphens
    .replace(/[\s_]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
