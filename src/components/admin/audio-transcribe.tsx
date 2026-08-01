"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, X, Loader2, Check, AlertCircle, DollarSign, Music } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [duration, setDuration] = useState(0);
  const [provider, setProvider] = useState("");
  const [language, setLanguage] = useState<"bn" | "en" | "auto">("bn");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setSuccess(false);

      const dur = await estimateAudioDuration(file);
      setDuration(dur);
      const cost = (dur / 60) * 0.006;
      setEstimatedCost(cost);
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

  const handleTranscribe = async () => {
    if (!audioFile) return;

    setTranscribing(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("language", language);
      formData.append("storeAudio", String(storeAudio));

      const response = await fetch("/api/admin/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Transcription failed");
      }

      setSuccess(true);
      setActualCost(data.metadata?.cost || 0);
      setDuration(data.metadata?.duration || 0);
      setProvider(data.metadata?.provider || "Whisper API");

      onTranscriptionComplete(data.text, data.audioUrl || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const handleRemove = () => {
    setAudioFile(null);
    setError("");
    setSuccess(false);
    setEstimatedCost(0);
    setActualCost(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 rounded-sm border border-accent/20 bg-surface-raised/80 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-accent" />
          <h3 className="font-serif text-sm font-semibold text-content" lang="en">
            {label}
          </h3>
        </div>

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
      </div>

      {!audioFile ? (
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
              MP3, M4A, WAV, OGG up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
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

            {!transcribing && !success && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-content-faint transition hover:text-accent"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {estimatedCost > 0 && !success && (
            <div className="flex items-center gap-1.5 text-xs text-content-faint">
              <DollarSign className="h-3.5 w-3.5 text-accent" />
              <span>
                Estimated Whisper API cost: <strong>${estimatedCost < 0.001 ? "<$0.001" : `$${estimatedCost.toFixed(4)}`}</strong>
              </span>
            </div>
          )}

          {!success && (
            <button
              type="button"
              onClick={handleTranscribe}
              disabled={transcribing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-medium text-surface transition hover:opacity-90 disabled:opacity-50"
            >
              {transcribing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcribing mixed audio via Whisper API...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Transcribe & Auto-fill Body
                </>
              )}
            </button>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-sm border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-500">
              <Check className="h-4 w-4 shrink-0" />
              <span>
                Transcription complete via {provider}! {actualCost === 0 ? "Cost: FREE" : `Cost: $${actualCost.toFixed(4)}`}. Text added to Body.
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 rounded-sm border border-red-500/20 bg-red-500/5 p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
