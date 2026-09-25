/**
 * Audio Manifest and Cue types for synchronized playback in Thoughts.Whatever.
 */

export interface WordTiming {
  start: number;
  text: string;
}

export interface Cue {
  id: number;
  start: number;
  end: number;
  text: string;
  words: WordTiming[];
  confidence: number;
}

export interface AudioManifest {
  version: 1;
  durationSec: number;
  peaks: number[];
  cues: Cue[];
}

/**
 * Binary search for the active cue given the current playback time.
 * Returns -1 if no cue is active or before first cue.
 */
export function findActiveCueIndex(cues: Cue[], currentTime: number): number {
  if (!cues || cues.length === 0) return -1;
  if (currentTime < cues[0].start) return -1;
  if (currentTime >= cues[cues.length - 1].end) return cues.length - 1;

  let low = 0;
  let high = cues.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cue = cues[mid];

    if (currentTime >= cue.start && currentTime < cue.end) {
      return mid;
    }
    if (currentTime < cue.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // If between cues (pause), return the closest preceding cue
  return Math.max(0, high);
}

/**
 * Finds the index of the active word in a cue given currentTime.
 */
export function findActiveWordIndex(cue: Cue, currentTime: number): number {
  if (!cue.words || cue.words.length === 0) return -1;
  let activeIdx = 0;
  for (let i = 0; i < cue.words.length; i++) {
    if (currentTime >= cue.words[i].start) {
      activeIdx = i;
    } else {
      break;
    }
  }
  return activeIdx;
}

/**
 * Format seconds to mm:ss or hh:mm:ss.
 */
export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const s = Math.floor(seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const mm = mins.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");

  if (hrs > 0) {
    return `${hrs}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
