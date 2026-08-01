export const TRANSCRIPTION_ERRORS = {
  // Authentication Errors
  AUTH_REQUIRED: {
    message: "Authentication required",
    solution: "Your session has expired. Please refresh the page and sign in again.",
    retryable: false,
  },
  AUTH_EXPIRED: {
    message: "Session expired",
    solution: "Please refresh the page (Ctrl+R / Cmd+R) and sign in again.",
    retryable: false,
  },

  // Configuration Errors
  NO_API_KEY: {
    message: "Groq transcription service not configured",
    solution: "Administrator needs to set GROQ_API_KEY in Vercel environment variables.",
    retryable: false,
  },
  GROQ_INVALID_KEY: {
    message: "Groq API key is invalid",
    solution: "Administrator needs to update GROQ_API_KEY with a valid key from console.groq.com",
    retryable: false,
  },

  // File Errors
  NO_FILE: {
    message: "No audio file selected",
    solution: "Please select an audio file (MP3, M4A, WAV, OGG) and try again.",
    retryable: false,
  },
  INVALID_FORMAT: {
    message: "Unsupported audio format",
    solution: "Convert your audio to MP3, M4A, WAV, or OGG format before uploading.",
    retryable: false,
  },
  FILE_TOO_LARGE: {
    message: "Audio file too large",
    solution: "Compress your audio file to under 25MB or split it into shorter parts.",
    retryable: false,
  },
  FILE_READ_ERROR: {
    message: "Cannot read audio file",
    solution: "File may be corrupted. Try re-exporting your audio or selecting a different file.",
    retryable: false,
  },

  // API Errors
  TRANSCRIPTION_FAILED: {
    message: "Transcription failed",
    solution: "This may be a temporary network issue. Click 'Retry' to try again.",
    retryable: true,
  },
  GROQ_RATE_LIMIT: {
    message: "Groq rate limit reached",
    solution: "Free tier limit reached. Wait 30 seconds and click 'Retry'.",
    retryable: true,
  },
  NETWORK_ERROR: {
    message: "Network connection error",
    solution: "Check your internet connection and try again.",
    retryable: true,
  },
  TIMEOUT: {
    message: "Transcription timed out",
    solution: "Audio file may be too long. Try a shorter file or split into multiple parts.",
    retryable: true,
  },

  // Generic
  UNEXPECTED_ERROR: {
    message: "Unexpected error occurred",
    solution: "Please try again. Refresh the page if the problem persists.",
    retryable: true,
  },
} as const;

export function getErrorDetails(code: string) {
  return (
    TRANSCRIPTION_ERRORS[code as keyof typeof TRANSCRIPTION_ERRORS] ||
    TRANSCRIPTION_ERRORS.UNEXPECTED_ERROR
  );
}
