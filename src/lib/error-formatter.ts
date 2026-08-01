/**
 * Format raw error messages, JSON strings, and HTTP errors into human-readable text.
 */
export function formatErrorMessage(rawError: unknown): string {
  if (!rawError) return "An unknown error occurred. Please try again.";

  let errString = typeof rawError === "string" ? rawError : String(rawError);
  if (rawError instanceof Error) {
    errString = rawError.message;
  }

  // 1. Check for HTML response patterns (auth redirects or 500 HTML error pages)
  const htmlPatterns = [
    "Unexpected token '<'",
    "<!DOCTYPE",
    "<html",
    "<!doctype",
    "Unexpected token",
    "JSON.parse",
    "SyntaxError",
  ];

  if (htmlPatterns.some((pattern) => errString.toLowerCase().includes(pattern.toLowerCase()))) {
    if (errString.includes("401") || errString.includes("403")) {
      return "Your session has expired. Please refresh the page (Ctrl+R / Cmd+R) and sign in again.";
    }
    if (errString.includes("500") || errString.includes("502") || errString.includes("503")) {
      return "Server error occurred. Please try again in a moment. If the problem persists, check your GROQ_API_KEY configuration.";
    }
    return "Server returned an unexpected response. Please refresh the page and sign in again.";
  }

  // 2. Try parsing JSON error strings like: 500 {"error":{"message":"Internal Server Error"}}
  const jsonMatch = errString.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.error?.message) {
        errString = parsed.error.message;
      } else if (parsed.message) {
        errString = parsed.message;
      } else if (parsed.error) {
        errString = typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
      }
    } catch {
      /* Keep original string if JSON parsing fails */
    }
  }

  // 3. Specific error code & keyword handling
  if (errString.toLowerCase().includes("unauthorized") || errString.includes("401")) {
    return "Authentication failed. Your session may have expired. Please refresh the page and sign in again.";
  }

  if (errString.toLowerCase().includes("forbidden") || errString.includes("403")) {
    return "Access denied. Please refresh the page and sign in again.";
  }

  if (errString.toLowerCase().includes("internal_server_error") || errString.includes("500")) {
    return "Server error. Please check your GROQ_API_KEY configuration in Vercel settings and try again.";
  }

  if (errString.toLowerCase().includes("rate limit")) {
    return "API rate limit reached. Please wait 30 seconds and try again.";
  }

  if (errString.toLowerCase().includes("timeout")) {
    return "Request timed out after 5 minutes. Try a shorter audio file or split it into smaller parts.";
  }

  return errString.trim();
}
