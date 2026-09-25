# Reference Listening Room — Synced Bengali Audio Archive

**Date:** 2026-09-25
**Status:** Design approved
**Scope:** Add a reusable audio-with-synced-transcription capability to the Reference Library, seeded with the 1974 Debabrata Biswas recording.

---

## 1. Motivation

The Reference Library can catalog and read texts but cannot present recordings. The plumbing for audio already exists and is unused:

- `ReferenceType.AUDIO`, `ReferenceAssetKind.AUDIO`, `ReferenceAssetKind.TRANSCRIPT` are defined in the schema.
- `ReferenceAsset` already carries `durationSec`, `transcriptText`, and `narrator`.
- `deriveCapabilities()` in `src/lib/reference/rights-engine.ts:82` computes `canListen`, and **no UI consumes it**.

This design lights that path up: a `/reference/[slug]/listen` route, sibling to the existing `/reference/[slug]/read` reader, driven entirely by `ReferenceAsset` records so every future recording reuses it.

### Source material (first entry)

Located at `Reference/Reference/Debabrata Biswas/`:

| File | Detail |
|------|--------|
| `audio/Debabrata Biswas Talked(1974) About Rabindrasangeet.mp4` | 94 MB, 1280×720 H.264 + AAC, **1765 s (29 m 25 s)** |
| `Content/Debabrata Biswas.txt` | 24,157 chars Bengali prose, **255 danda-delimited sentences**, hard-wrapped, **no timestamps** |
| `Thumnail/Debabrata Biswas.png` | 3 MB portrait |

The recording is a personal tape dated 5 March 1974 in which Debabrata Biswas discusses his conflict with the Rabindrasangeet approval board. He speaks a Bangal dialect (`কইছিলাম`, `গাইতে পারি নাই`, `গপ্পো`) that ASR handles poorly — this constrains the whole timing design.

---

## 2. Design decisions

| Decision | Choice | Rejected alternatives |
|----------|--------|----------------------|
| Caption timing | Whisper supplies the clock, the human transcript supplies the text | Whisper text verbatim (destroys dialect accuracy); proportional timing (visible multi-second drift) |
| Media prep | Local ffmpeg stream-copy to audio-only `.m4a` (~28 MB) | Cloudinary transcode (credits, no local peaks); serve the 94 MB mp4 (3.4× bandwidth) |
| Scope | Reusable route driven by `ReferenceAsset` | One-off hardcoded page |
| Visualizer | Precomputed waveform track + live amplitude pulse at the playhead | Radial rings only; FFT bars; seismograph trace — all lack a seek affordance or an overview of 29 minutes |
| Layout | Stage header + synced transcript, toggle to theatre captions | Theatre only (unskimmable, unsearchable); transcript only (recording becomes a footnote) |

### Rights

The edition is recorded as `LICENSED` with `hostingMode: THOUGHTS_WHATEVER`, which is what `validateHostingRights()` requires for hosted playback. `rightsHolder`, `verificationNotes` and `evidenceUrl` are **left null** — they are real claims and are not invented here. The existing admin rights-review UI (`src/components/admin/reference/rights-review-modal.tsx`) fills them in later, writing a `ReferenceRightsLog` entry as it does.

`attribution` is populated only with facts established from the recording itself: speaker, date, and his recorded request that the tape be played for everyone after his death (*"আপনি দয়া করে আমার মৃত্যুর পর সকলকে সেটা শোনাবেন"*).

---

## 3. Data model

One new column, mirroring the `ReferenceEdition.readerManifest` precedent:

```prisma
model ReferenceAsset {
  // ...existing fields unchanged
  audioManifest Json?
}
```

```ts
interface AudioManifest {
  version: 1;
  durationSec: number;
  peaks: number[];        // normalized 0..1, ~1 bucket per 0.5s (~3530 entries)
  cues: Cue[];
}

interface Cue {
  id: number;             // 0-based, monotonic
  start: number;          // seconds
  end: number;
  text: string;           // the HUMAN transcript sentence, verbatim
  words: WordTiming[];
  confidence: number;     // 0..1, distance-to-anchor derived
}

interface WordTiming {
  start: number;
  text: string;
}
```

The manifest lives on the **AUDIO** asset because it is audio-timeline data. A separate **TRANSCRIPT** asset retains plain `transcriptText` for SEO, site search, and copy-paste.

No other schema change is needed.

---

## 4. Build pipeline

One-time, run locally per recording. Pure logic lives in `src/lib/reference/audio/` and is unit-tested; `scripts/reference-audio/` holds only I/O orchestration.

### 4.1 `extract.ts`

Uses `ffmpeg-static` (new devDependency; no system ffmpeg on this machine).

1. `-map 0:a -c:a copy` → `.m4a`. Stream copy, so no re-encode and no quality loss.
2. `-ac 1 -ar 16000 -c:a libopus -b:a 24k` → `.ogg` proxy, ~5 MB.
3. Decode PCM → peak buckets via `peaks.ts`.
4. `ffprobe` → exact `durationSec`.

### 4.2 `transcribe.ts`

Groq `whisper-large-v3`, `response_format: "verbose_json"`, `language: "bn"`, `timestamp_granularities: ["segment", "word"]`, run on the 5 MB Opus proxy — comfortably under Groq's 25 MB limit, so a single call with no chunking or offset arithmetic.

Word granularity is requested but treated as optional: if absent, alignment falls back to segments alone.

The raw Whisper response is cached to disk so alignment can be re-run and tuned without re-billing.

### 4.3 `align.ts` — the core

Whisper's text will be wrong in places; its *timings* are sound. The job is to transfer those timings onto the human sentences.

1. Split the human transcript into sentences on `।`, `?`, `!` (`bengali-text.ts`).
2. Normalize both sides: strip punctuation, fold Bengali/ASCII digits, collapse whitespace.
3. **Anchor discovery** — find token n-grams (n = 3, falling back to 2) that occur exactly once in each side and are monotonically ordered. Dialect words differ, but proper nouns, numbers and common words match reliably.
4. **Interpolate** between consecutive anchors: each human sentence gets `start`/`end` by linear interpolation on cumulative character count within the anchor span.
5. **Score** each cue: `confidence` falls off with distance from the nearest anchor.
6. **Distribute words** within each sentence proportional to grapheme count (`word-timing.ts`).

Word-level karaoke is therefore *interpolated inside a sentence*, not force-aligned. Within a ~7 s sentence the error is a few hundred milliseconds — imperceptible — and sentence boundaries remain pinned to real Whisper timings. This avoids word-aligning dialect text, which is the genuinely hard problem.

The script prints the lowest-confidence cues so they can be spot-checked before seeding.

### 4.4 `seed.ts`

Cloudinary upload (`.m4a` + portrait), then `validateHostingRights()` **before** the Prisma upsert so a mis-marked asset cannot be seeded at all. Upserts `ReferenceWork` → `ReferenceEdition` → `ReferenceRights` + `ReferenceSource` + `ReferenceAsset[]` (AUDIO with manifest, TRANSCRIPT with text, COVER).

Work slug: `debabrata-biswas-rabindrasangeet-1974`.

---

## 5. Runtime

### Route

```
src/app/reference/[slug]/listen/
  page.tsx                  — server component
  listening-room-client.tsx — thin client boundary
```

`page.tsx` mirrors `read/page.tsx`: fetch work + editions + assets, call `deriveCapabilities()`, and **if `canListen` is false render the rights notice instead of a player**. Generates metadata and a `VTT` link.

### Components — `src/components/reference/audio/`

| Unit | Responsibility | Depends on |
|------|---------------|-----------|
| `listening-room.tsx` | State shell: mode toggle (persisted to `localStorage`, defaults to transcript), composes the rest | the hooks below |
| `use-audio-engine.ts` | `<audio>` element, `AnalyserNode`, rAF amplitude sampling, play/pause/seek/rate | — |
| `use-active-cue.ts` | Binary-search the active cue from `currentTime` | `Cue[]` |
| `waveform-track.tsx` | Canvas: peaks, progress fill, live pulse, playhead, click/drag seek, keyboard | amplitude, progress |
| `pulse-button.tsx` | Breathing play control | amplitude |
| `caption-stage.tsx` | Theatre mode: prev/current/next lines, word karaoke | active cue |
| `transcript-scroller.tsx` | Full transcript, active highlight, auto-scroll, click-to-seek | cues, active index |
| `transport-bar.tsx` | Play, ±15 s, rate, timecode, download | engine |

Binary search in `use-active-cue` is deliberate: 255 cues re-scanned at 60 fps is wasteful, and future recordings will be longer.

### Failure modes designed around

**The pulse can flatline.** `createMediaElementSource()` on a cross-origin file produces a silent graph unless `crossOrigin="anonymous"` is set on the element *before* `src`, and the host sends CORS headers. Cloudinary does. If the analyser nonetheless reads all zeros, the engine falls back to a **cue-driven synthetic envelope** — the cues already say when speech is happening — so the visualizer degrades to plausible rather than dead.

**Two players at once.** The global `AudioProvider`/`MiniPlayer` deliberately survives navigation, so entering the listening room mid-narration would play both streams. `listening-room.tsx` calls the provider's `close()` on mount.

**Autoplay policy.** The `AudioContext` is constructed and resumed only inside the play gesture.

**Reduced motion.** `prefers-reduced-motion` freezes the pulse to a static waveform; progress fill and captions still update.

### Wiring existing surfaces

- `reference-card.tsx` — শুনুন affordance when `canListen`.
- `reference/[slug]/page.tsx` — Listen CTA beside the existing Read CTA.
- WebVTT generated from the same cues, served for download and as a native `<track>`.

---

## 6. Testing

**Unit (jest, configured):**
- `align.ts` — anchor discovery, monotonicity, interpolation, confidence scoring, degenerate cases (no anchors, single anchor, anchors out of order).
- `bengali-text.ts` — danda splitting, abbreviation and digit edge cases.
- `word-timing.ts` — timings monotonic, bounded by the sentence, sum to its duration.
- `vtt.ts` — timestamp formatting, escaping.
- `peaks.ts` — bucket count, normalization bounds.

**E2E (playwright, configured):**
- Listen page renders for a rights-verified asset.
- Rights gate: `RIGHTS_UNVERIFIED` shows the notice, no `<audio>` element.
- Captions advance as `currentTime` changes.
- Clicking a transcript sentence seeks.

---

## 7. Housekeeping

`Reference/` is untracked and holds a 94 MB mp4 — it is added to `.gitignore`. Only derived artifacts (`audioManifest` JSON, checked-in cue fixtures for tests) enter the repo. `.superpowers/` is likewise ignored.

---

## 8. Out of scope

- Admin UI for uploading and aligning new recordings — the pipeline is script-driven for now.
- Translation or transliteration of captions.
- Multi-speaker diarization.
- Chapter markers.
