"""Repair impossible late caption timing without changing transcript text.

Selected acoustic anchors are retained. Implausible intervening boundaries are
estimated by transcript length, then snapped to nearby silence.
This is an estimate, not word-level forced alignment.
"""

import json
import re
import subprocess
from bisect import bisect_left
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/data/reference/audio/debabrata-biswas-manifest.json"
AUDIO = ROOT / "Reference/Reference/Debabrata Biswas/audio/Debabrata Biswas Talked(1974) About Rabindrasangeet.mp4"
FFMPEG = ROOT / "node_modules/ffmpeg-static/ffmpeg.exe"


def silence_boundaries():
    result = subprocess.run(
        [str(FFMPEG), "-hide_banner", "-i", str(AUDIO), "-af", "silencedetect=noise=-25dB:d=0.3", "-f", "null", "-"],
        capture_output=True, text=True, check=False,
    )
    if result.returncode:
        raise RuntimeError(result.stderr[-1000:])
    return sorted(float(value) for value in re.findall(r"silence_(?:start|end):\s*([\d.]+)", result.stderr))


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    cues = manifest["cues"]
    silences = silence_boundaries()
    for first, last in [(26, 35), (61, 260)]:
        start, end = cues[first - 1]["end"], cues[last]["start"]
        weights = [max(5, len(cue["text"].strip())) for cue in cues[first:last]]
        total = sum(weights)
        boundaries = [start]
        cumulative = 0
        for weight in weights[:-1]:
            cumulative += weight
            expected = start + (end - start) * cumulative / total
            pos = bisect_left(silences, expected)
            nearby = silences[max(0, pos - 1):pos + 1]
            close = [time for time in nearby if abs(time - expected) <= 0.6]
            boundaries.append(min(close, key=lambda time: abs(time - expected)) if close else expected)
        boundaries.append(end)

        for index in range(first, last):
            cue = cues[index]
            cue["start"] = round(boundaries[index - first], 2)
            cue["end"] = round(boundaries[index - first + 1], 2)
            words = cue["text"].split()
            word_total = sum(max(1, len(word)) for word in words)
            offset = 0
            cue["words"] = []
            for word in words:
                cue["words"].append({"start": round(cue["start"] + (cue["end"] - cue["start"]) * offset / word_total, 2), "text": word})
                offset += max(1, len(word))
            cue["confidence"] = 0.5
        print(f"Re-timed cues {first}–{last - 1} from {start:.2f}s to {end:.2f}s.")

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Transcript text unchanged.")


if __name__ == "__main__":
    main()
