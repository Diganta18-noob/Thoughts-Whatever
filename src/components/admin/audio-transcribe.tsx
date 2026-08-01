"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, X, Loader2, Check, AlertCircle, Music, Copy, RefreshCw, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { countBengaliWords, readingMinutes } from "@/lib/bengali";
import { formatErrorMessage } from "@/lib/error-formatter";
import { getErrorDetails } from "@/lib/transcription-errors";

interface AudioTranscribeProps {
  onTranscriptionComplete: (text: string, audioUrl?: string) => void;
  label?: string;
  maxSizeMB?: number;
  storeAudio?: boolean;
}

export function AudioTranscribe({
  onTranscriptionComplete,
  label = "Transcribe Audio Narration / Reel",
  maxSizeMB = 25,
  storeAudio = true,
}: AudioTranscribeProps) {
  // Pre-flight check state
  const [apiStatus, setApiStatus] = useState<"checking" | "available" | "unavailable">("checking");
  const [apiError, setApiError] = useState<string | null>(null);

  // Transcriber state
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [provider, setProvider] = useState("");
  const [language, setLanguage] = useState<"bn" | "en" | "auto">("bn");
  const [dragActive, setDragActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  // Progress state
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  // Review stage state
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [audioUrlResult, setAudioUrlResult] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Perform pre-flight API check on mount
  const checkApiAvailability = useCallback(async () => {
    setApiStatus("checking");
    setApiError(null);

    try {
      const response = await fetch("/api/admin/transcribe/check", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        setApiError("Session expired. Please refresh the page and sign in again.");
        setApiStatus("unavailable");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setApiError(data.error || "Groq transcription service unavailable");
        setApiStatus("unavailable");
      } else {
        setApiStatus("available");
      }
    } catch (err) {
      setApiError("Cannot connect to transcription service. Check your internet connection.");
      setApiStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    checkApiAvailability();
  }, [checkApiAvailability]);

  const validateFile = useCallback(
    (file: File): string | null => {
      const validTypes = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "audio/x-m4a"];
      const isExtensionValid = file.name.match(/\.(mp3|m4a|wav|webm|ogg)$/i);

      if (!validTypes.includes(file.type) && !isExtensionValid) {
        return "File must be an audio format (MP3, M4A, WAV, WebM, or OGG)";
      }

      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        return `File size must be under ${maxSizeMB}MB`;
      }

      return null;
    },
    [maxSizeMB]
  );

  const estimateAudioDuration = useCallback(async (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      });
      audio.addEventListener("error", () => {
        resolve(60);
      });
    });
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setAudioFile(file);
      setError("");
      setErrorCode(null);
      setReviewMode(false);
      setAccepted(false);

      const dur = await estimateAudioDuration(file);
      setDuration(dur);
    },
    [estimateAudioDuration, validateFile]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileSelect(file);
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) await handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleTranscribe = async (isRetry = false) => {
    if (!audioFile) return;

    if (!isRetry) {
      setRetryCount(0);
    }

    setTranscribing(true);
    setError("");
    setErrorCode(null);
    setProgress(5);
    setProgressMessage("Uploading audio file to Groq...");

    // Simulated progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setProgressMessage("Uploading audio file to Groq...");
          return prev + 5;
        } else if (prev < 75) {
          setProgressMessage("Transcribing mixed speech via Groq Whisper Large v3...");
          return prev + 3;
        } else if (prev < 95) {
          setProgressMessage("Formatting Bengali-English script with Llama-3.3...");
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("language", language);
      formData.append("storeAudio", String(storeAudio));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout

      const response = await fetch("/api/admin/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        credentials: "include",
      });

      clearTimeout(timeoutId);
      clearInterval(progressInterval);

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        if (response.status === 401 || response.status === 403) {
          setErrorCode("AUTH_EXPIRED");
          throw new Error("AUTH_EXPIRED: Session expired. Please refresh the page and sign in again.");
        }
        throw new Error(`Server returned HTTP ${response.status}. Please refresh and try again.`);
      }

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const code = data.code || "TRANSCRIPTION_FAILED";
        setErrorCode(code);

        const isRetryable =
          code === "TRANSCRIPTION_FAILED" ||
          code === "GROQ_RATE_LIMIT" ||
          response.status >= 500;

        if (isRetryable && retryCount < MAX_RETRIES) {
          setRetryCount(retryCount + 1);
          setError(`${data.error || "Transcription failed"}. Retrying... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return handleTranscribe(true);
        }

        throw new Error(data.error || "Transcription failed");
      }

      // Success
      setProgress(100);
      setProgressMessage("Transcription complete!");
      setDuration(data.metadata?.duration || 0);
      setProvider(data.metadata?.provider || "Groq Whisper Large v3");
      setReviewText(data.text || "");
      setAudioUrlResult(data.audioUrl || undefined);
      setReviewMode(true);
      setRetryCount(0);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setProgress(0);

      if (err instanceof Error && err.name === "AbortError") {
        setErrorCode("TIMEOUT");
        setError("Transcription timed out after 5 minutes. Try a shorter audio file.");
      } else {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.startsWith("AUTH_EXPIRED:")) {
          setError(errMsg.replace("AUTH_EXPIRED: ", ""));
          setApiStatus("unavailable");
        } else {
          setError(formatErrorMessage(err));
        }
      }
    } finally {
      clearInterval(progressInterval);
      setTranscribing(false);
      setTimeout(() => {
        setProgress(0);
        setProgressMessage("");
      }, 1500);
    }
  };

  const handleAcceptReview = () => {
    onTranscriptionComplete(reviewText, audioUrlResult);
    setAccepted(true);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(reviewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleReset = () => {
    setAudioFile(null);
    setError("");
    setErrorCode(null);
    setReviewMode(false);
    setReviewText("");
    setAccepted(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const wordCount = countBengaliWords(reviewText);
  const readTime = readingMinutes(reviewText);

  // 1. Pre-flight checking state
  if (apiStatus === "checking") {
    return (
      <div className="rounded-sm border border-rule bg-surface-raised/90 p-5 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent" />
        <p className="mt-2 text-sm text-content-faint">Checking Groq transcription service status...</p>
      </div>
    );
  }

  // 2. Pre-flight unavailable state
  if (apiStatus === "unavailable") {
    return (
      <div className="rounded-sm border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-500">Transcription Service Unavailable</p>
            <p className="mt-1 text-xs text-red-500/80">{apiError}</p>
            <button
              type="button"
              onClick={checkApiAvailability}
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Check
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal transcriber UI
  return (
    <div className="space-y-4 rounded-sm border border-accent/20 bg-surface-raised/90 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-accent" />
          <h3 className="font-serif text-sm font-semibold text-content" lang="en">
            {reviewMode ? "Transcription Final Review" : label}
          </h3>
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-green-500">
            Groq Whisper Ready
          </span>
        </div>

        {!reviewMode && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-content-faint" lang="en">
              Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "bn" | "en" | "auto")}
              className="rounded-sm border border-rule bg-surface px-2 py-1 text-xs text-content focus:border-accent"
            >
              <option value="bn">Bengali (বাংলা)</option>
              <option value="en">English</option>
              <option value="auto">Auto-detect</option>
            </select>
          </div>
        )}
      </div>

      {/* Upload State */}
      {!audioFile && !reviewMode && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-sm border border-dashed p-6 text-center transition",
            dragActive
              ? "border-accent bg-accent/5"
              : "border-rule hover:border-accent/50 hover:bg-accent/5"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            <Music className="h-8 w-8 text-content-faint" />
            <p className="text-sm text-content">
              <span className="text-accent font-medium">Click to upload</span> or drag audio file
            </p>
            <p className="text-xs text-content-faint">
              MP3, M4A, WAV, OGG up to {maxSizeMB}MB (Ultra-Fast & Free via Groq)
            </p>
          </div>
        </div>
      )}

      {/* Audio Selected / Transcribing Progress State */}
      {audioFile && !reviewMode && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-sm border border-rule bg-surface p-3">
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-content">{audioFile.name}</p>
                <p className="text-xs text-content-faint">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB · {formatDuration(duration)} min
                </p>
              </div>
            </div>

            {!transcribing && (
              <button
                type="button"
                onClick={handleReset}
                className="text-content-faint transition hover:text-accent"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {transcribing && (
            <div className="space-y-2 rounded-sm border border-accent/20 bg-accent/5 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-content-soft font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                  {progressMessage}
                </span>
                <span className="text-accent font-semibold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-rule overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!transcribing && (
            <button
              type="button"
              onClick={() => handleTranscribe(false)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-sm font-medium text-surface transition hover:opacity-90 disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
              Start Groq Transcription & Review
            </button>
          )}
        </div>
      )}

      {/* Review Stage */}
      {reviewMode && (
        <div className="space-y-3 border-t border-rule pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold text-content uppercase tracking-wider">
                Review Transcribed Text
              </span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.65rem] font-medium text-accent">
                {provider}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-content-faint">
              <span>{wordCount} words</span>
              <span>·</span>
              <span>~{readTime} min read</span>
              <span>·</span>
              <span className="text-green-500 font-medium">Cost: FREE</span>
            </div>
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={8}
            lang="bn"
            spellCheck={false}
            className="w-full rounded-sm border border-rule bg-surface p-3 font-bengali text-bengali-base leading-relaxed text-content focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Transcribed text will appear here for review..."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptReview}
                className={cn(
                  "inline-flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition",
                  accepted
                    ? "bg-green-600 text-white"
                    : "bg-accent text-surface hover:opacity-90"
                )}
              >
                <Check className="h-4 w-4" />
                {accepted ? "Inserted into Piece!" : "Accept & Insert into Piece"}
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 rounded-sm border border-rule bg-surface px-3 py-2 text-sm text-content-soft transition hover:text-content"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-content-faint transition hover:text-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              New Audio File
            </button>
          </div>
        </div>
      )}

      {/* Error display with Retry Button */}
      {error && !transcribing && (
        <div className="flex items-start gap-2.5 text-xs text-red-500 rounded-sm border border-red-500/20 bg-red-500/5 p-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <p className="font-medium">{error}</p>
            {errorCode && getErrorDetails(errorCode)?.solution && (
              <p className="text-red-500/80">{getErrorDetails(errorCode).solution}</p>
            )}

            {audioFile && !error.includes("Session expired") && (
              <button
                type="button"
                onClick={() => handleTranscribe(true)}
                className="inline-flex items-center gap-1.5 rounded-sm bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500 transition hover:bg-red-500/20"
              >
                <RefreshCw className="h-3 w-3" />
                Retry Transcription {retryCount > 0 ? `(Attempt ${retryCount + 1}/${MAX_RETRIES})` : ""}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
