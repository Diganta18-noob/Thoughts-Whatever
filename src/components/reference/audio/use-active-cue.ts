import { useMemo } from "react";
import { Cue, findActiveCueIndex, findActiveWordIndex } from "@/lib/reference/audio/types";

export interface ActiveCueInfo {
  cueIndex: number;
  cue: Cue | null;
  prevCue: Cue | null;
  nextCue: Cue | null;
  activeWordIndex: number;
}

export function useActiveCue(cues: Cue[], currentTime: number): ActiveCueInfo {
  return useMemo(() => {
    if (!cues || cues.length === 0) {
      return {
        cueIndex: -1,
        cue: null,
        prevCue: null,
        nextCue: null,
        activeWordIndex: -1,
      };
    }

    const cueIndex = findActiveCueIndex(cues, currentTime);
    const cue = cueIndex >= 0 ? cues[cueIndex] : null;
    const prevCue = cueIndex > 0 ? cues[cueIndex - 1] : null;
    const nextCue = cueIndex >= 0 && cueIndex < cues.length - 1 ? cues[cueIndex + 1] : null;
    const activeWordIndex = cue ? findActiveWordIndex(cue, currentTime) : -1;

    return {
      cueIndex,
      cue,
      prevCue,
      nextCue,
      activeWordIndex,
    };
  }, [cues, currentTime]);
}
