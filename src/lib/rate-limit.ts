/**
 * In-memory Sliding Window Rate Limiter.
 * Works seamlessly in Node.js serverless and server environments.
 */

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const storage = new Map<string, RateLimitTracker>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, tracker] of storage.entries()) {
      if (now > tracker.resetTime) {
        storage.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number;      // Max allowed requests in window
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function rateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const tracker = storage.get(identifier);

  if (!tracker || now > tracker.resetTime) {
    storage.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      limit: options.max,
      remaining: options.max - 1,
      reset: now + options.windowMs,
    };
  }

  if (tracker.count >= options.max) {
    return {
      success: false,
      limit: options.max,
      remaining: 0,
      reset: tracker.resetTime,
    };
  }

  tracker.count += 1;
  return {
    success: true,
    limit: options.max,
    remaining: options.max - tracker.count,
    reset: tracker.resetTime,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
