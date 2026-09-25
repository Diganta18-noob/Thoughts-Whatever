import { Cue } from "./types";

/**
 * Generate standard WebVTT subtitles string from an array of timed cues.
 */
export function generateVtt(cues: Cue[]): string {
  const lines: string[] = ["WEBVTT", "Kind: captions", "Language: bn", ""];

  for (const cue of cues) {
    const startStr = formatVttTimestamp(cue.start);
    const endStr = formatVttTimestamp(cue.end);
    lines.push(`${cue.id + 1}`);
    lines.push(`${startStr} --> ${endStr}`);
    lines.push(cue.text);
    lines.push("");
  }

  return lines.join("\n");
}

function formatVttTimestamp(seconds: number): string {
  const totalMs = Math.round(seconds * 1000);
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  const hh = hrs.toString().padStart(2, "0");
  const mm = mins.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");
  const mmm = ms.toString().padStart(3, "0");

  return `${hh}:${mm}:${ss}.${mmm}`;
}
