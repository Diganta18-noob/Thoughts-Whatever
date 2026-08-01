import { toFile } from "groq-sdk";
import { getGroqClient, GROQ_WHISPER_MODEL } from "@/lib/groq";
import { getOpenAIClient } from "@/lib/openai";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EventAction =
  | "ATTEMPT"
  | "RETRY"
  | "SKIP"
  | "FALLBACK"
  | "SUCCESS"
  | "ERROR"
  | "CIRCUIT_OPEN"
  | "AUTO_FIX";

export interface TranscriptionEvent {
  timestamp: string;
  provider: string;
  action: EventAction;
  message: string;
  durationMs?: number;
  isAutoFix?: boolean;
}

export interface TranscriptionResult {
  text: string;
  provider: string;
  eventLog: TranscriptionEvent[];
  recoveryAttempts: number;
  autoFixed: boolean;
}

interface ProviderConfig {
  name: string;
  id: string;
  available: boolean;
  transcribe: (
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    language: string,
    prompt: string
  ) => Promise<string>;
}

// ─── Circuit Breaker (in-memory, per serverless cold start) ──────────────────

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const circuits: Record<string, CircuitState> = {};

function getCircuit(providerId: string): CircuitState {
  if (!circuits[providerId]) {
    circuits[providerId] = { failures: 0, lastFailure: 0, isOpen: false };
  }
  const c = circuits[providerId];

  // Auto-reset after cooldown
  if (c.isOpen && Date.now() - c.lastFailure > CIRCUIT_COOLDOWN_MS) {
    c.failures = 0;
    c.isOpen = false;
  }
  return c;
}

function recordFailure(providerId: string): void {
  const c = getCircuit(providerId);
  c.failures++;
  c.lastFailure = Date.now();
  if (c.failures >= CIRCUIT_THRESHOLD) {
    c.isOpen = true;
  }
}

function recordSuccess(providerId: string): void {
  const c = getCircuit(providerId);
  c.failures = 0;
  c.isOpen = false;
}

// ─── Error Classification ────────────────────────────────────────────────────

function isPermanentError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("401") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid api key") ||
    lower.includes("402") ||
    lower.includes("payment required") ||
    lower.includes("403") ||
    lower.includes("forbidden")
  );
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.toLowerCase().includes("rate limit");
}

// ─── Provider Implementations ────────────────────────────────────────────────

async function transcribeOpenRouter(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  _language: string,
  prompt: string
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY!;
  const base64Data = buffer.toString("base64");
  const mediaType = mimeType || "audio/mpeg";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch("https://agentrouter.org/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key.trim()}`,
        "HTTP-Referer": "https://thoughts-whatever.vercel.app",
        "X-Title": "Thoughts Whatever Journal",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: [
          {
            role: "system",
            content: `${prompt}\nYour task is to transcribe audio into accurate Markdown text. English quotes must remain in English script, and Bengali in proper Bengali script. Output ONLY the verbatim text script.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio narration accurately into text:" },
              {
                type: "image_url",
                image_url: { url: `data:${mediaType};base64,${base64Data}` },
              },
            ],
          },
        ],
        temperature: 0.0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Agent Router HTTP ${res.status}: ${errText.substring(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("No transcription text returned from Agent Router");
    return text;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function transcribeGroq(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  language: string,
  prompt: string
): Promise<string> {
  const groq = getGroqClient();
  if (!groq) throw new Error("Groq client not configured");

  const groqFile = await toFile(buffer, fileName || "narration.mp3", {
    type: mimeType || "audio/mpeg",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const transcription = await groq.audio.transcriptions.create(
      {
        file: groqFile,
        model: GROQ_WHISPER_MODEL,
        language: language === "auto" ? undefined : language,
        prompt,
        temperature: 0.0,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);
    if (!transcription.text) throw new Error("Empty transcription from Groq");
    return transcription.text;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function transcribeOpenAI(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  language: string,
  prompt: string
): Promise<string> {
  const openai = getOpenAIClient();
  const openaiFile = await toFile(buffer, fileName || "narration.mp3", {
    type: mimeType || "audio/mpeg",
  });

  const transcription = await openai.audio.transcriptions.create({
    file: openaiFile,
    model: "whisper-1",
    language: language === "auto" ? undefined : language,
    prompt,
    temperature: 0.0,
  });

  if (!transcription.text) throw new Error("Empty transcription from OpenAI");
  return transcription.text;
}

// ─── Delay Helper ────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main Resilient Transcription Engine ─────────────────────────────────────

export async function resilientTranscribe(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  language: string,
  prompt: string
): Promise<TranscriptionResult> {
  const eventLog: TranscriptionEvent[] = [];
  let recoveryAttempts = 0;
  let autoFixed = false;

  function log(
    provider: string,
    action: EventAction,
    message: string,
    durationMs?: number,
    isAutoFix?: boolean
  ) {
    eventLog.push({
      timestamp: new Date().toISOString(),
      provider,
      action,
      message,
      durationMs,
      isAutoFix,
    });
    console.log(`[TranscriptionEngine] [${provider}] ${action}: ${message}`);
  }

  // Build provider chain based on available keys
  const providers: ProviderConfig[] = [];

  if (process.env.OPENROUTER_API_KEY?.trim()) {
    providers.push({
      name: "Agent Router AI",
      id: "agentrouter",
      available: true,
      transcribe: transcribeOpenRouter,
    });
  }

  if (getGroqClient()) {
    providers.push({
      name: "Groq Whisper v3",
      id: "groq",
      available: true,
      transcribe: transcribeGroq,
    });
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    providers.push({
      name: "OpenAI Whisper",
      id: "openai",
      available: true,
      transcribe: transcribeOpenAI,
    });
  }

  if (providers.length === 0) {
    log("System", "ERROR", "No transcription providers configured");
    throw new EngineError(
      "No transcription service configured. Set OPENROUTER_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY.",
      "NO_API_KEY",
      503,
      eventLog
    );
  }

  const MAX_RETRIES = 2;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    const circuit = getCircuit(provider.id);

    // Circuit breaker check
    if (circuit.isOpen) {
      log(
        provider.name,
        "CIRCUIT_OPEN",
        `Skipped — circuit breaker open (${circuit.failures} failures in last 5 min). Auto-resets after cooldown.`
      );
      continue;
    }

    // Try with retries
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const isRetry = attempt > 0;
      if (isRetry) {
        recoveryAttempts++;
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
        log(
          provider.name,
          "RETRY",
          `Retry ${attempt}/${MAX_RETRIES} after ${backoffMs}ms backoff...`,
          undefined,
          true
        );
        await delay(backoffMs);
      }

      const startTime = Date.now();
      log(
        provider.name,
        isRetry ? "RETRY" : "ATTEMPT",
        `${isRetry ? "Retrying" : "Attempting"} transcription...`
      );

      try {
        const text = await provider.transcribe(buffer, fileName, mimeType, language, prompt);
        const elapsed = Date.now() - startTime;

        recordSuccess(provider.id);

        const wasAutoFixed = i > 0 || isRetry;
        if (wasAutoFixed) autoFixed = true;

        log(
          provider.name,
          wasAutoFixed ? "AUTO_FIX" : "SUCCESS",
          `Transcription completed (${text.length} chars, ${elapsed}ms)${wasAutoFixed ? " — auto-recovered!" : ""}`,
          elapsed,
          wasAutoFixed
        );

        return {
          text,
          provider: `${provider.name}${wasAutoFixed ? " (Auto-Recovered)" : ""}`,
          eventLog,
          recoveryAttempts,
          autoFixed,
        };
      } catch (err: unknown) {
        const elapsed = Date.now() - startTime;
        const errMsg = err instanceof Error ? err.message : String(err);

        recordFailure(provider.id);

        // Permanent error — don't retry this provider
        if (isPermanentError(err)) {
          log(
            provider.name,
            "ERROR",
            `Permanent error (${errMsg.substring(0, 150)}) — skipping provider`,
            elapsed
          );
          break; // Move to next provider
        }

        // Rate limit — don't retry, move to next provider
        if (isRateLimitError(err)) {
          log(
            provider.name,
            "ERROR",
            `Rate limited — skipping to next provider`,
            elapsed
          );
          break; // Move to next provider
        }

        // Transient error — retry if attempts remain
        log(
          provider.name,
          "ERROR",
          `Transient error: ${errMsg.substring(0, 150)}`,
          elapsed
        );

        if (attempt === MAX_RETRIES) {
          log(provider.name, "SKIP", `Max retries exhausted — moving to next provider`);
        }
      }
    }

    // Log fallback to next provider
    if (i < providers.length - 1) {
      log(
        providers[i + 1].name,
        "FALLBACK",
        `Falling back from ${provider.name} → ${providers[i + 1].name}`,
        undefined,
        true
      );
      recoveryAttempts++;
    }
  }

  // All providers exhausted
  log("System", "ERROR", "All transcription providers failed after automatic recovery attempts");
  throw new EngineError(
    "All transcription providers failed. Check API keys and account balances.",
    "ALL_PROVIDERS_FAILED",
    503,
    eventLog
  );
}

// ─── Custom Error with Event Log ─────────────────────────────────────────────

export class EngineError extends Error {
  code: string;
  status: number;
  eventLog: TranscriptionEvent[];

  constructor(
    message: string,
    code: string,
    status: number,
    eventLog: TranscriptionEvent[]
  ) {
    super(message);
    this.name = "EngineError";
    this.code = code;
    this.status = status;
    this.eventLog = eventLog;
  }
}
