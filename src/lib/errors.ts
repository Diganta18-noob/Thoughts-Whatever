/**
 * Centralized Error Normalization & Security Sanitization Layer
 *
 * Guarantees that raw JSON, database exceptions, stack traces, Axios errors,
 * server file paths, connection strings, and internal secrets are NEVER
 * exposed in user-facing UI or client payloads.
 */

export interface NormalizedError {
  title: string;
  message: string;
  code: string;
  statusCode: number;
  retryable: boolean;
  referenceId?: string;
}

/**
 * Controlled, allowlisted safe error messages for end users.
 */
export const SAFE_ERROR_MESSAGES = {
  NETWORK_ERROR:
    "We're having trouble connecting to the server. Please check your connection and try again.",
  TIMEOUT: "The request took too long to complete. Please try again.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: "We couldn't find what you're looking for.",
  CONFLICT: "This action could not be completed because the data has changed.",
  VALIDATION_ERROR: "Please check the information you entered and try again.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  INTERNAL_SERVER_ERROR: "Something went wrong on our side. Please try again.",
  SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again in a few moments.",
  GENERIC: "Something went wrong. Please try again.",
} as const;

export const SAFE_ERROR_TITLES: Record<string, string> = {
  NETWORK_ERROR: "Connection Issue",
  TIMEOUT: "Request Timed Out",
  UNAUTHORIZED: "Sign In Required",
  FORBIDDEN: "Access Denied",
  NOT_FOUND: "Not Found",
  CONFLICT: "Action Conflict",
  VALIDATION_ERROR: "Invalid Information",
  RATE_LIMITED: "Rate Limit Exceeded",
  INTERNAL_SERVER_ERROR: "Something Went Wrong",
  SERVICE_UNAVAILABLE: "Service Temporarily Unavailable",
  GENERIC: "Something Went Wrong",
};

/**
 * Patterns that indicate technical errors, system internals, or sensitive information.
 * Any error string matching these patterns must NEVER be displayed directly.
 */
const TECHNICAL_PATTERNS = [
  /prismaclient/i,
  /mongoservererror/i,
  /mongonetworkerror/i,
  /axioserror/i,
  /econnrefused/i,
  /enotfound/i,
  /etimedout/i,
  /econnreset/i,
  /node_modules/i,
  /postgresql:\/\//i,
  /postgres:\/\//i,
  /mongodb(\+srv)?:\/\//i,
  /mysql:\/\//i,
  /redis:\/\//i,
  /bearer\s+[a-zA-Z0-9._-]+/i,
  /jwt/i,
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /at\s+[a-zA-Z0-9_$.]+\s+\(/i, // Stack trace lines
  /at\s+async\s+[a-zA-Z0-9_$.]+/i,
  /syntaxerror/i,
  /typeerror/i,
  /referenceerror/i,
  /rangeerror/i,
  /cannot read propert/i,
  /is not a function/i,
  /unexpected token/i,
  /failed to fetch/i,
  /networkerror/i,
  /<!doctype/i,
  /<html/i,
  /\{\s*["'](?:error|message|stack|code)["']\s*:/i, // Raw JSON objects
  /[A-Za-z]:\\[\w.-]+/, // Windows file paths
  /\/(?:home|var|usr|etc|app|workspace|tmp|root)\//, // Linux paths
];

/**
 * Checks if a message contains any technical, database, or sensitive content.
 */
export function containsTechnicalDetails(message: string): boolean {
  if (!message || typeof message !== "string") return false;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Strips secrets or system details if they happen to appear in a text string.
 */
export function scrubSensitiveDetails(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/(?:postgresql|postgres|mongodb(\+srv)?|mysql|redis):\/\/[^\s]+/gi, "[DATABASE_URL_REDACTED]")
    .replace(/(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"]?[^\s,'"]+['"]?/gi, "[CREDENTIAL_REDACTED]")
    .replace(/[A-Za-z]:\\[\w.-]+(?:\\[\w.-]+)+/g, "[PATH]")
    .replace(/\/(?:home|var|usr|etc|app|workspace|tmp|root)\/[^\s]+/g, "[PATH]");
}

/**
 * Known user-facing safe validation error phrases in English and Bengali.
 * These are safe to display directly to the end user if they do not contain technical details.
 */
const SAFE_USER_MESSAGE_KEYWORDS = [
  "অনুগ্রহ করে",
  "আবশ্যক",
  "সঠিক",
  "ব্যর্থ",
  "ভুল",
  "পাসওয়ার্ড",
  "ইমেল",
  "শিরোনাম",
  "please enter",
  "is required",
  "invalid email",
  "invalid password",
  "password must",
  "passwords do not match",
  "already registered",
  "already exists",
  "not found",
  "permission denied",
  "session expired",
  "file size must",
  "must be an image",
  "audio narration",
];

function isSafeUserMessage(msg: string): boolean {
  if (!msg || typeof msg !== "string") return false;
  if (containsTechnicalDetails(msg)) return false;
  if (msg.length > 200) return false;

  const lower = msg.toLowerCase();
  return SAFE_USER_MESSAGE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Extract HTTP status code and response payload from Axios-like, Fetch, or API errors.
 */
function extractHttpStatusAndMessage(error: any): { status?: number; message?: string; code?: string } {
  if (!error || typeof error !== "object") return {};

  // 1. Axios-like error
  if (error.isAxiosError || error.response) {
    const status = error.response?.status;
    const data = error.response?.data;
    const code = error.code || (typeof data === "object" ? data?.code : undefined);

    let message: string | undefined;
    if (typeof data === "string") {
      message = data;
    } else if (typeof data === "object" && data !== null) {
      message = data.error?.message || data.error || data.message;
      if (typeof message !== "string") message = undefined;
    }

    return { status, message, code };
  }

  // 2. Custom API Response object { ok: false, error: "...", code: "..." }
  if (error.status && typeof error.status === "number") {
    return { status: error.status, message: error.error || error.message, code: error.code };
  }

  return {};
}

/**
 * Master error normalizer.
 *
 * Converts ANY runtime error, exception, rejection, raw JSON, Axios error,
 * or unknown value into a safe, normalized user-facing contract.
 */
export function normalizeError(error: unknown, fallbackMessage?: string): NormalizedError {
  // 1. Handle null, undefined, empty
  if (error === null || error === undefined || error === "") {
    return {
      title: SAFE_ERROR_TITLES.GENERIC,
      message: fallbackMessage || SAFE_ERROR_MESSAGES.GENERIC,
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      retryable: true,
    };
  }

  // 2. Extract digest / referenceId if available (e.g. Next.js digest)
  let referenceId: string | undefined;
  if (error && typeof error === "object" && "digest" in error) {
    const d = (error as any).digest;
    if (typeof d === "string" && /^[a-zA-Z0-9_-]{4,64}$/.test(d)) {
      referenceId = d;
    }
  }

  // 3. Inspect Axios / HTTP response errors
  const httpDetails = extractHttpStatusAndMessage(error);
  const status = httpDetails.status;

  if (status) {
    if (status === 400) {
      const msg = httpDetails.message;
      const safeMsg = msg && isSafeUserMessage(msg) ? msg : SAFE_ERROR_MESSAGES.VALIDATION_ERROR;
      return {
        title: SAFE_ERROR_TITLES.VALIDATION_ERROR,
        message: safeMsg,
        code: "VALIDATION_ERROR",
        statusCode: 400,
        retryable: false,
        referenceId,
      };
    }
    if (status === 401) {
      return {
        title: SAFE_ERROR_TITLES.UNAUTHORIZED,
        message: SAFE_ERROR_MESSAGES.UNAUTHORIZED,
        code: "UNAUTHORIZED",
        statusCode: 401,
        retryable: false,
        referenceId,
      };
    }
    if (status === 403) {
      return {
        title: SAFE_ERROR_TITLES.FORBIDDEN,
        message: SAFE_ERROR_MESSAGES.FORBIDDEN,
        code: "FORBIDDEN",
        statusCode: 403,
        retryable: false,
        referenceId,
      };
    }
    if (status === 404) {
      return {
        title: SAFE_ERROR_TITLES.NOT_FOUND,
        message: SAFE_ERROR_MESSAGES.NOT_FOUND,
        code: "NOT_FOUND",
        statusCode: 404,
        retryable: false,
        referenceId,
      };
    }
    if (status === 409) {
      return {
        title: SAFE_ERROR_TITLES.CONFLICT,
        message: SAFE_ERROR_MESSAGES.CONFLICT,
        code: "CONFLICT",
        statusCode: 409,
        retryable: true,
        referenceId,
      };
    }
    if (status === 422) {
      const msg = httpDetails.message;
      const safeMsg = msg && isSafeUserMessage(msg) ? msg : SAFE_ERROR_MESSAGES.VALIDATION_ERROR;
      return {
        title: SAFE_ERROR_TITLES.VALIDATION_ERROR,
        message: safeMsg,
        code: "UNPROCESSABLE_ENTITY",
        statusCode: 422,
        retryable: false,
        referenceId,
      };
    }
    if (status === 429) {
      return {
        title: SAFE_ERROR_TITLES.RATE_LIMITED,
        message: SAFE_ERROR_MESSAGES.RATE_LIMITED,
        code: "RATE_LIMITED",
        statusCode: 429,
        retryable: true,
        referenceId,
      };
    }
    if (status === 502 || status === 503 || status === 504) {
      return {
        title: SAFE_ERROR_TITLES.SERVICE_UNAVAILABLE,
        message: SAFE_ERROR_MESSAGES.SERVICE_UNAVAILABLE,
        code: "SERVICE_UNAVAILABLE",
        statusCode: status,
        retryable: true,
        referenceId,
      };
    }
    if (status >= 500) {
      return {
        title: SAFE_ERROR_TITLES.INTERNAL_SERVER_ERROR,
        message: fallbackMessage || SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        code: "INTERNAL_SERVER_ERROR",
        statusCode: status,
        retryable: true,
        referenceId,
      };
    }
  }

  // 4. Inspect raw string or Error.message
  let rawMessage = "";
  if (typeof error === "string") {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message;
  } else if (error && typeof error === "object") {
    const candidate = (error as any).message || (error as any).error;
    if (typeof candidate === "string") {
      rawMessage = candidate;
    } else {
      rawMessage = "";
    }
  }

  // 5. Network / Timeout detection
  const isNetwork =
    /failed to fetch|network\s*error|econnrefused|enotfound|econnreset|offline/i.test(rawMessage) ||
    (error instanceof Error && error.name === "TypeError" && rawMessage.includes("fetch"));

  if (isNetwork) {
    return {
      title: SAFE_ERROR_TITLES.NETWORK_ERROR,
      message: SAFE_ERROR_MESSAGES.NETWORK_ERROR,
      code: "NETWORK_ERROR",
      statusCode: 0,
      retryable: true,
      referenceId,
    };
  }

  const isTimeout =
    /timeout|timed\s*out|etimedout/i.test(rawMessage) ||
    (error instanceof Error && error.name === "AbortError");

  if (isTimeout) {
    return {
      title: SAFE_ERROR_TITLES.TIMEOUT,
      message: SAFE_ERROR_MESSAGES.TIMEOUT,
      code: "TIMEOUT",
      statusCode: 408,
      retryable: true,
      referenceId,
    };
  }

  // 6. JSON string parsing safety (e.g. 500 {"error":"PrismaClient..."})
  if (rawMessage.includes("{") && rawMessage.includes("}")) {
    try {
      const match = rawMessage.match(/(\{[\s\S]*\})/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        const inner = parsed.error?.message || parsed.error || parsed.message;
        if (typeof inner === "string" && !containsTechnicalDetails(inner) && isSafeUserMessage(inner)) {
          return {
            title: SAFE_ERROR_TITLES.GENERIC,
            message: inner,
            code: parsed.code || "API_ERROR",
            statusCode: 400,
            retryable: true,
            referenceId,
          };
        }
      }
    } catch {
      // Ignore JSON parsing failure and continue to safe fallback
    }
  }

  // 7. Check if the error string is a known safe user-facing message
  if (rawMessage && isSafeUserMessage(rawMessage)) {
    return {
      title: SAFE_ERROR_TITLES.GENERIC,
      message: rawMessage.trim(),
      code: "USER_MESSAGE",
      statusCode: 400,
      retryable: true,
      referenceId,
    };
  }

  // 8. Reject all technical/database/internal messages and return standardized safe fallback
  return {
    title: SAFE_ERROR_TITLES.INTERNAL_SERVER_ERROR,
    message: fallbackMessage || SAFE_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    code: "INTERNAL_SERVER_ERROR",
    statusCode: 500,
    retryable: true,
    referenceId,
  };
}
