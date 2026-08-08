import { PostHog } from "posthog-node";

let posthogServerClient: PostHog | null = null;

export function getPostHogServerClient(): PostHog | null {
  if (posthogServerClient) return posthogServerClient;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!key) return null;

  posthogServerClient = new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  });

  return posthogServerClient;
}
