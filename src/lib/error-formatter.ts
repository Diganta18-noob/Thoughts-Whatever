import { normalizeError, containsTechnicalDetails } from "./errors";

/**
 * Format raw error messages, JSON strings, and HTTP errors into human-readable,
 * production-safe text.
 */
export function formatErrorMessage(rawError: unknown): string {
  if (!rawError) return "An unknown error occurred. Please try again.";

  // Normalize through central security layer first
  const normalized = normalizeError(rawError);

  // If input was a string that is already safe and user-friendly, return normalized message
  if (typeof rawError === "string") {
    const trimmed = rawError.trim();
    if (!containsTechnicalDetails(trimmed) && trimmed.length > 0 && trimmed.length < 200) {
      return normalized.message;
    }
  }

  return normalized.message;
}

export { normalizeError } from "./errors";
