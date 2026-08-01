/**
 * Bengali text, numbers, and dates.
 *
 * Everything reader-facing that involves a number or a date goes through this
 * file. `৭ মিনিট পাঠ` reads as native; `7 min read` reads as a translation.
 * That distinction is most of the credibility of a Bengali literary site.
 *
 * A note on the regexes below. Several of the characters this file exists to
 * handle are invisible — zero-width joiners, nukta, halant, vowel signs. They
 * are built from codepoints via `ch()` rather than pasted in as literals,
 * because a literal zero-width character cannot be reviewed in a diff and is
 * silently destroyed by editors, terminals, and copy-paste.
 */

const ch = (code: number) => String.fromCharCode(code);
const span = (from: number, to: number) => `${ch(from)}-${ch(to)}`;

// ─── Numerals ───────────────────────────────────────────────

const BN_ZERO = 0x09e6; // U+09E6 BENGALI DIGIT ZERO
const BN_NINE = 0x09ef;
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;
const BN_DIGIT_RE = new RegExp(`[${span(BN_ZERO, BN_NINE)}]`, "g");

/** 2026 → ২০২৬ */
export function toBengaliNumber(input: number | string | undefined | null): string {
  if (input === undefined || input === null || input === "") return "";
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** ২০২৬ → 2026. Needed so Bengali numerals stay searchable by Latin digits. */
export function toLatinNumber(input: string | undefined | null): string {
  if (!input) return "";
  return input.replace(BN_DIGIT_RE, (d) => String(d.charCodeAt(0) - BN_ZERO));
}

// ─── Dates ──────────────────────────────────────────────────

const BN_GREGORIAN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

const BN_WEEKDAYS = [
  "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার",
];

const BANGLA_MONTHS = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
  "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র",
];

/** ঋতু — the six Bengali seasons, two months each, starting at বৈশাখ. */
const BANGLA_SEASONS = ["গ্রীষ্ম", "বর্ষা", "শরৎ", "হেমন্ত", "শীত", "বসন্ত"];

/** ২৯ জুলাই ২০২৬ */
export function formatBengaliDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return `${toBengaliNumber(d.getDate())} ${BN_GREGORIAN_MONTHS[d.getMonth()]} ${toBengaliNumber(d.getFullYear())}`;
}

/** বুধবার */
export function formatBengaliWeekday(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return BN_WEEKDAYS[d.getDay()];
}

function isGregorianLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Gregorian → Bangla calendar, using the **revised** rule (fixed month
 * lengths, বৈশাখ ১ pinned to 14 April) rather than the traditional
 * astronomically-computed West Bengal reckoning.
 *
 * The revised rule is deterministic and needs no ephemeris. Against a
 * traditional Bengali almanac it can differ by a day. For dating essays that
 * is an acceptable trade — but it is a real one, so it is written down here
 * rather than left as a surprise.
 */
export function toBanglaDate(date: Date | string): {
  day: number;
  month: number; // 1–12, বৈশাখ = 1
  year: number;
  monthName: string;
  season: string;
  formatted: string; // ১৪ শ্রাবণ ১৪৩৩
} | null {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;

  const g = { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };

  // The Bangla year turns over on 14 April.
  const startedThisYear = g.m > 4 || (g.m === 4 && g.d >= 14);
  const epochYear = startedThisYear ? g.y : g.y - 1;
  const banglaYear = epochYear - 593;

  // Days elapsed since বৈশাখ ১. UTC on both sides so DST cannot shift the count.
  const epoch = Date.UTC(epochYear, 3, 14);
  const today = Date.UTC(g.y, g.m - 1, g.d);
  let elapsed = Math.floor((today - epoch) / 86_400_000);

  // ফাল্গুন gains a day when the Gregorian year it falls in is a leap year.
  // ফাল্গুন of Bangla year B runs Feb–Mar of Gregorian year B + 594.
  const falgunLength = isGregorianLeap(banglaYear + 594) ? 31 : 30;
  const lengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, falgunLength, 30];

  // Clamped at the last month: the epoch choice above guarantees elapsed
  // never exceeds the year length, so this only guards against bad input.
  let month = 0;
  while (month < 11 && elapsed >= lengths[month]) {
    elapsed -= lengths[month];
    month += 1;
  }

  return {
    day: elapsed + 1,
    month: month + 1,
    year: banglaYear,
    monthName: BANGLA_MONTHS[month],
    season: BANGLA_SEASONS[Math.floor(month / 2)],
    formatted: `${toBengaliNumber(elapsed + 1)} ${BANGLA_MONTHS[month]} ${toBengaliNumber(banglaYear)}`,
  };
}

/** ২৯ জুলাই ২০২৬ · ১৪ শ্রাবণ ১৪৩৩ — the dual date shown on every piece. */
export function formatDualDate(date: Date | string): string {
  const bangla = toBanglaDate(date);
  const gregorian = formatBengaliDate(date);
  return bangla ? `${gregorian} · ${bangla.formatted}` : gregorian;
}

// ─── Reading time ───────────────────────────────────────────

/**
 * Bengali prose is read more slowly than English at the same word count —
 * longer orthographic words, dense conjuncts, and a literary register slow
 * readers further. 150 wpm fits essay-register Bangla far better than the
 * 200–250 wpm figure most blog engines inherit from English.
 */
const BENGALI_WPM = 150;

export function countBengaliWords(text: string | undefined | null): number {
  if (!text) return 0;
  const stripped = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~`|-]/g, " ");
  return stripped.split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(text: string | undefined | null): number {
  if (!text) return 1;
  return Math.max(1, Math.round(countBengaliWords(text) / BENGALI_WPM));
}

/** ৭ মিনিট পাঠ */
export function formatReadingTime(minutes: number | undefined | null): string {
  if (minutes === undefined || minutes === null) return "১ মিনিট পাঠ";
  return `${toBengaliNumber(minutes)} মিনিট পাঠ`;
}

/** ১৮:৪২ — for the আবৃত্তি player and documentary runtimes. */
export function formatBengaliDuration(totalSeconds: number | undefined | null): string {
  if (totalSeconds === undefined || totalSeconds === null) return "০:০০";
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${toBengaliNumber(m)}:${toBengaliNumber(String(s).padStart(2, "0"))}`;
}

// ─── Search normalisation ───────────────────────────────────

/**
 * Bengali search fails in a specific, predictable way: a reader types
 * "রবিন্দ্রনাথ" or "রবীন্দ্র নাথ", gets nothing back, and concludes the
 * search is broken. The script offers many ways to write the same sound —
 * ি/ী, ু/ূ, শ/ষ/স, ন/ণ — plus nukta forms and zero-width characters that are
 * invisible on screen but unequal to a computer.
 *
 * Two keys are produced:
 *   normalizeBengali  — conservative; safe for display and near-exact matching
 *   bengaliSearchKey  — aggressive consonant skeleton, for fuzzy matching
 */

/** U+200B ZWSP, U+200C ZWNJ, U+200D ZWJ, U+FEFF BOM. */
const INVISIBLE = new RegExp(
  `[${ch(0x200b)}${ch(0x200c)}${ch(0x200d)}${ch(0xfeff)}]`,
  "g",
);

/** U+09BC BENGALI SIGN NUKTA. */
const NUKTA = new RegExp(ch(0x09bc), "g");

/** U+09BE–U+09CC dependent vowel signs, plus U+09D7 AU length mark. */
const MATRAS = new RegExp(`[${span(0x09be, 0x09cc)}${ch(0x09d7)}]`, "g");

/** U+09CD BENGALI SIGN VIRAMA (halant). */
const HALANT = new RegExp(ch(0x09cd), "g");

/** U+0981 candrabindu, U+0982 anusvara, U+0983 visarga. */
const NASAL_SIGNS = new RegExp(`[${span(0x0981, 0x0983)}]`, "g");

/** Conservative fold: invisible characters, nukta forms, whitespace, case. */
export function normalizeBengali(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .normalize("NFC")
    .replace(INVISIBLE, "")
    // Precomposed nukta consonants → base form: য়→য, ড়→ড, ঢ়→ঢ
    .replace(/য়/g, "য")
    .replace(/ড়/g, "ড")
    .replace(/ঢ়/g, "ঢ")
    // Decomposed sequences (base consonant + nukta).
    .replace(NUKTA, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Aggressive fold to a consonant skeleton. Drops every dependent vowel sign,
 * folds the three sibilants together, folds ণ→ন, strips halant so conjuncts
 * match their spelled-out equivalents, and removes spaces entirely — so
 * "রবীন্দ্র নাথ" and "রবীন্দ্রনাথ" collapse to a single key.
 */
export function bengaliSearchKey(input: string): string {
  return (
    normalizeBengali(input)
      // Bengali numerals → Latin, so ১৯৪৭ and 1947 match each other.
      .replace(BN_DIGIT_RE, (d) => String(d.charCodeAt(0) - BN_ZERO))
      .replace(MATRAS, "")
      .replace(HALANT, "")
      .replace(NASAL_SIGNS, "")
      // Independent vowel length pairs: ঈ→ই, ঊ→উ
      .replace(/ঈ/g, "ই")
      .replace(/ঊ/g, "উ")
      // Sibilants শ ষ স sound alike to most speakers.
      .replace(/[শষ]/g, "স")
      .replace(/ণ/g, "ন")
      .replace(/ঋ/g, "র")
      .replace(/\s+/g, "")
  );
}

/** Does `haystack` plausibly contain `needle`, allowing Bengali spelling drift? */
export function bengaliIncludes(haystack: string, needle: string): boolean {
  if (!needle.trim()) return false;
  return bengaliSearchKey(haystack).includes(bengaliSearchKey(needle));
}

// ─── Slugs ──────────────────────────────────────────────────

/** U+0980–U+09FF is the Bengali block. */
const SLUG_ALLOWED = new RegExp(`[^${span(0x0980, 0x09ff)} a-z0-9-]`, "g");

/**
 * Slugs stay in Bengali rather than being transliterated. Unicode URLs work
 * everywhere now, they are readable to the actual audience, and they carry
 * more Bengali search signal than a lossy Latin approximation would.
 */
export function bengaliSlug(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .normalize("NFC")
    .replace(INVISIBLE, "")
    .trim()
    .toLowerCase()
    .replace(SLUG_ALLOWED, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
