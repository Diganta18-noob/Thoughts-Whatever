/**
 * Format raw error messages, JSON strings, and HTTP errors into human-readable text.
 */
export function formatErrorMessage(rawError: unknown): string {
  if (!rawError) return "An unknown error occurred. Please try again.";

  let errString = typeof rawError === "string" ? rawError : String(rawError);
  if (rawError instanceof Error) {
    errString = rawError.message;
  }

  // Try parsing JSON error strings like: 500 {"error":{"message":"Internal Server Error","type":"internal_server_error"}}
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

  // Specific common patterns
  if (errString.includes("Unexpected token '<'") || errString.includes("<!DOCTYPE")) {
    return "Server connection issue or session expired. Please refresh the page and sign in again.";
  }

  if (errString.toLowerCase().includes("internal_server_error") || errString.includes("500")) {
    return "The service returned a 500 server error. Please check your GROQ_API_KEY / OPENAI_API_KEY in Vercel settings or try again.";
  }

  if (errString.toLowerCase().includes("unauthorized") || errString.includes("401")) {
    return "Session expired. Please log in again to continue.";
  }

  return errString;
}
