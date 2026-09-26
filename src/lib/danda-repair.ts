/**
 * Repairs a specific data corruption: every lowercase "l" in Latin-script
 * text was replaced with the Bengali danda, then Bengali punctuation
 * normalization stripped the space before it and forced one after.
 *
 *   "mortals"     -> "morta। s"      (join reading: no space before the l)
 *   "Uneasy lies" -> "Uneasy। ies"   (split reading: space before the l)
 *
 * Both readings are always generated and scored against a word list.
 * Anything that does not resolve cleanly is reported, never guessed at —
 * the affected text is literary quotation, where a wrong fix is worse
 * than no fix.
 */

export const DANDA = "।";

/** A danda preceded by a Latin letter cannot occur in Bengali orthography. */
const CORRUPTION = /[A-Za-z]।/;
const LETTER = /[A-Za-z']/;

export interface DandaReview {
  dandaIndex: number;
  context: string;
  joined: string;
  split: string;
  reason: string;
}

export interface DandaRepairResult {
  text: string;
  resolved: number;
  reviews: DandaReview[];
}

export function hasCorruption(text: string): boolean {
  return CORRUPTION.test(text);
}

/** The maximal run of Latin letters containing `pos`, or "" if pos is not on one. */
export function tokenAround(text: string, pos: number): string {
  if (pos < 0 || pos >= text.length || !LETTER.test(text[pos])) return "";
  let a = pos;
  let b = pos;
  while (a > 0 && LETTER.test(text[a - 1])) a--;
  while (b < text.length && LETTER.test(text[b])) b++;
  return text.slice(a, b);
}

export function makeWordChecker(words: Iterable<string>): (word: string) => boolean {
  const set = new Set<string>();
  for (const w of words) set.add(w.trim().toLowerCase());

  return (word: string): boolean => {
    if (!word) return false;
    const lower = word.toLowerCase();
    if (set.has(lower)) return true;
    if (lower.endsWith("'s") && set.has(lower.slice(0, -2))) return true;
    return false;
  };
}

function contextWindow(text: string, at: number): string {
  return text.slice(Math.max(0, at - 40), Math.min(text.length, at + 40));
}

export function repairString(
  source: string,
  isWord: (word: string) => boolean,
): DandaRepairResult {
  let text = source;
  let resolved = 0;
  const reviews: DandaReview[] = [];
  let from = 0;

  for (;;) {
    // Locate the next corruption at or after `from`.
    const rel = text.slice(from).search(CORRUPTION);
    if (rel === -1) break;

    const letterIdx = from + rel;
    const dandaIdx = letterIdx + 1;
    const hasSpace = text[dandaIdx + 1] === " ";
    const head = text.slice(0, dandaIdx);
    const tail = text.slice(dandaIdx + 1 + (hasSpace ? 1 : 0));

    const joined = head + "l" + tail;
    const split = head + " l" + tail;

    // In `joined` the restored l sits at dandaIdx; in `split` at dandaIdx + 1.
    const joinOk = isWord(tokenAround(joined, dandaIdx));
    const splitOk =
      isWord(tokenAround(split, dandaIdx + 1)) && isWord(tokenAround(split, dandaIdx - 1));

    if (joinOk && !splitOk) {
      text = joined;
      resolved++;
      from = dandaIdx;
      continue;
    }

    if (splitOk && !joinOk) {
      text = split;
      resolved++;
      from = dandaIdx + 2;
      continue;
    }

    reviews.push({
      dandaIndex: dandaIdx,
      context: contextWindow(text, dandaIdx),
      joined,
      split,
      reason:
        joinOk && splitOk
          ? "ambiguous: both readings are words"
          : "neither reading is a word",
    });
    // Skip past this occurrence so the loop terminates.
    from = dandaIdx + 1;
  }

  return { text, resolved, reviews };
}
