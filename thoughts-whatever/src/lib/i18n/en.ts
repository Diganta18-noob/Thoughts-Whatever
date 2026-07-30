/**
 * The English chrome. This file is the schema: every key that exists here must
 * exist in `bn.ts`, and TypeScript enforces that.
 *
 * Only interface strings live here. Nothing a reader came to read — no titles,
 * no bodies, no author names, no tag labels. Section names come from
 * `src/lib/nav.ts`, which already carries `labelEn` / `labelBn`, so they are
 * not duplicated here.
 *
 * Keys are dotted by area. `{placeholders}` are filled at call time.
 */

export const en = {
  // Header and chrome ------------------------------------------------------
  "header.home": "{site} — home",
  "header.search": "Search",
  "header.saved": "Saved pieces",
  "header.reading": "Reading settings",
  "header.instagram": "Instagram",
  "header.openMenu": "Open menu",
  "header.closeMenu": "Close menu",

  // Navigation group headings, shared by the header and the footer ---------
  "nav.sections": "Sections",
  "nav.more": "More",
  "nav.saved": "Saved",

  // Footer ----------------------------------------------------------------
  // The colophon names the faces. It is translated rather than fixed because
  // a Bengali reader knows these types by their Bengali names.
  "footer.colophon": "Set in Noto Serif Bengali, Hind Siliguri, and Galada.",

  // Home ------------------------------------------------------------------
  "home.alsoFeatured": "Also featured",
  "home.whereItStarts": "Where it starts",

  // Archive ---------------------------------------------------------------
  "archive.clearFilters": "Clear filters",
  "archive.noMatch": "Nothing matches those filters.",

  // Authors and series -----------------------------------------------------
  // The counts are badges beside a section title. The number itself is
  // formatted by the caller, so these strings carry only the noun that goes
  // with it — which is why Bengali needs three of them where English needs one.
  "authors.label": "Author",
  "authors.count": "{count} authors",
  "series.parts": "{count} parts",
  "series.allParts": "All {count} parts",

  // Empty sections ---------------------------------------------------------
  "empty.nothingPublished": "Nothing published yet.",
  "empty.comingSoon": "More is on the way.",
  "empty.noDocumentaries": "No documentaries published yet.",
  "empty.noAuthors": "No authors yet.",
  "empty.noSeries": "No series has started yet.",
  "empty.noAuthorPieces": "Nothing published about this author yet.",

  // 404 and error ----------------------------------------------------------
  // The code is a key so Bengali gets Bengali numerals — ৪০৪ — like every
  // other number on the site.
  "notFound.code": "404",
  "notFound.title": "This page isn't here",
  "notFound.body":
    "The piece may have moved, or the link may be missing a part. Try one of these instead.",
  "error.label": "Something broke",
  "error.title": "Something went wrong",
  "error.body": "That one is on our side. Give it another try.",
  "error.home": "Back to the first page",

  // Language toggle -------------------------------------------------------
  "lang.label": "Interface language",
  "lang.choose": "Choose interface language",
  "lang.note": "The writing stays in Bengali.",

  // Piece metadata ---------------------------------------------------------
  // The label only; what follows it — author names, titles, tags — is content.
  "piece.about": "About:",
  "piece.hasNarration": "Has narration",

  // Piece apparatus --------------------------------------------------------
  // Headings the page generates around the writing, never the writing itself.
  // `timeline` and `sources` name the blocks under a documentary; the words
  // inside those blocks are research and stay Bengali.
  "piece.contents": "Contents",
  "piece.filedUnder": "Filed under",
  "piece.timeline": "Timeline",
  "piece.sources": "Sources",
  "piece.sourcesNote":
    "If you find an error in any of this, tell me — it will be corrected.",

  // Captions under the embed. No full stop: they label the video, they are
  // not sentences about it.
  "piece.fullTextBelow": "Full text below",
  "piece.reelExpanded": "What the reel says, written out in full below",

  // Series navigation at the foot of a piece.
  "piece.seriesNav": "Parts of this series",
  "piece.previous": "Previous",
  "piece.next": "Next",

  // The letter (newsletter) ------------------------------------------------
  "letter.label": "The letter",
  "letter.blockTitle": "One letter a month",
  "letter.blockBody":
    "New writing, something worth rereading from the archive, and whatever I'm reading. No ads, no three emails a week.",
  "letter.emailLabel": "Email address",
  "letter.emailPlaceholder": "Your email",
  "letter.send": "Send",
  "letter.footerPitch":
    "One letter a month — new writing, things worth reading, and whatever got cut along the way.",

  "letter.intro1":
    "One letter goes out a month. It carries that month's new writing, something older from the archive worth reading again, and a note on what I'm reading.",
  "letter.intro2":
    "What it never carries: ads, sponsored links, three emails a week, or a “do you still want these?” check-in. The address goes to no one and is sold nowhere.",
  "letter.intro3":
    "Every letter has an unsubscribe link at the foot. One click and it's done — you won't be asked why.",

  // Unsubscribe ------------------------------------------------------------
  "letter.unsubEyebrow": "Unsubscribe",
  "letter.unsubTitle": "Stopping the letter",
  "letter.unsubNoToken":
    "The address wasn't in that link. The “stop the letter” link at the foot of any letter will work.",
  "letter.unsubAsk":
    "To stop receiving the letter, press the button once.",
  "letter.unsubConfirm": "Stop the letter",
  "letter.unsubKeep": "Keep it coming",
  "letter.unsubAfter":
    "The writing stays right here. Come read whenever you feel like it.",

  // System messages from /api/subscribe and /api/unsubscribe.
  // The routes send a `code`; these are what the reader actually sees, so the
  // language follows the interface rather than the server.
  "letter.msg.subscribed":
    "You're on the list. The month's letter will reach you.",
  "letter.msg.invalidEmail": "Enter a valid email address.",
  "letter.msg.unreadable": "That request couldn't be read.",
  "letter.msg.saveFailed": "Can't save that right now. Try again shortly.",
  "letter.msg.missingToken": "That link is incomplete.",
  "letter.msg.unknownToken": "That link no longer works.",
  "letter.msg.unsubscribed": "Done. No more letters.",
  "letter.msg.network": "Trouble connecting. Try again.",
  "letter.msg.failed": "Something went wrong. Try again.",

  // Shared verbs and small words ------------------------------------------
  "common.loadMore": "Load more",
  "common.loading": "Loading",
  "common.retry": "Try again",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.close": "Close",
  "common.back": "Back",
  "common.all": "All",
  "common.clear": "Clear",
  "common.share": "Share",
  "common.copy": "Copy link",
  "common.copied": "Copied",
  "common.empty": "Nothing here yet.",
  "common.count": "{count} pieces",
} as const;

export type TranslationKey = keyof typeof en;

/**
 * The shape every dictionary must have: exactly these keys, any string value.
 * Widening the values matters — `typeof en` alone would demand the *English*
 * strings verbatim, which is not a schema, it's a copy.
 */
export type Dictionary = Record<TranslationKey, string>;
