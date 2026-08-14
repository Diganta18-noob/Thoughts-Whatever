import { getAllPublishedSlugs } from "@/lib/pieces";
import { withTimeout } from "@/lib/utils";

let cachedSlugs: Awaited<ReturnType<typeof getAllPublishedSlugs>> | null = null;

export async function getBuildTimeSlugs() {
  if (cachedSlugs) return cachedSlugs;
  try {
    cachedSlugs = await withTimeout(getAllPublishedSlugs(50), [], 8000);
    return cachedSlugs;
  } catch {
    return [];
  }
}
