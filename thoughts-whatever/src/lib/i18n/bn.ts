/**
 * The Bengali chrome. Mirrors `en.ts` key for key — `satisfies Dictionary` makes
 * a missing or misspelled key a compile error rather than a blank button.
 *
 * These are interface words only. A reader who switches to Bengali sees Bengali
 * navigation and Bengali buttons around writing that was already Bengali.
 *
 * Where the codebase already had a Bengali word for something (সংরক্ষণ, বাতিল,
 * সম্পাদনা, মুছুন), that word is kept, so the toggle does not quietly rename
 * controls readers have already learned.
 */

import type { Dictionary } from "./en";

export const bn = {
  // Header and chrome ------------------------------------------------------
  "header.home": "{site} — প্রথম পাতা",
  "header.search": "খোঁজ",
  "header.saved": "সংরক্ষিত লেখা",
  "header.reading": "পড়ার বিন্যাস",
  "header.instagram": "ইনস্টাগ্রাম",
  "header.openMenu": "মেনু খুলুন",
  "header.closeMenu": "মেনু বন্ধ করুন",

  // Navigation group headings, shared by the header and the footer ---------
  "nav.sections": "বিভাগ",
  "nav.more": "আরও",
  "nav.saved": "সংরক্ষিত",

  // Footer ----------------------------------------------------------------
  "footer.colophon": "হরফ — নোটো সেরিফ বাংলা, হিন্দ শিলিগুড়ি ও গলাদা।",

  // Home ------------------------------------------------------------------
  "home.alsoFeatured": "আরও নির্বাচিত",
  "home.whereItStarts": "যেখান থেকে শুরু",

  // Archive ---------------------------------------------------------------
  "archive.clearFilters": "ফিল্টার সরান",
  "archive.noMatch": "এই শর্তে কিছু পাওয়া গেল না।",

  // Authors and series -----------------------------------------------------
  // Bengali counts a person (জন), an instalment (কিস্তি) and a piece of writing
  // (টি লেখা) with different classifiers. English gets by with the plural, so
  // the split lives in the dictionary rather than at the call site.
  "authors.label": "লেখক",
  "authors.count": "{count} জন",
  "series.parts": "{count} কিস্তি",
  "series.allParts": "সব {count} কিস্তি",

  // Empty sections ---------------------------------------------------------
  "empty.nothingPublished": "এখনও কিছু প্রকাশিত হয়নি।",
  "empty.comingSoon": "শিগগিরই আসছে।",
  "empty.noDocumentaries": "এখনও কোনও তথ্যচিত্র প্রকাশিত হয়নি।",
  "empty.noAuthors": "এখনও কোনও লেখক যুক্ত হননি।",
  "empty.noSeries": "এখনও কোনও ধারাবাহিক শুরু হয়নি।",
  "empty.noAuthorPieces": "এই লেখককে নিয়ে এখনও কিছু প্রকাশিত হয়নি।",

  // 404 and error ----------------------------------------------------------
  "notFound.code": "৪০৪",
  "notFound.title": "এই পাতাটা নেই",
  "notFound.body":
    "হয়তো লেখাটা সরানো হয়েছে, নয়তো লিংকে কিছু বাদ পড়েছে। নিচের যেকোনও দিকে যেতে পারেন।",
  "error.label": "গোলমাল",
  "error.title": "কিছু একটা ভুল হয়েছে",
  "error.body": "দোষটা আমাদের দিকের। একবার আবার চেষ্টা করে দেখুন।",
  "error.home": "প্রথম পাতায় ফিরুন",

  // Language toggle -------------------------------------------------------
  "lang.label": "ইন্টারফেসের ভাষা",
  "lang.choose": "ইন্টারফেসের ভাষা বেছে নিন",
  "lang.note": "লেখা বাংলাতেই থাকবে।",

  // Piece metadata ---------------------------------------------------------
  "piece.about": "বিষয়:",
  "piece.hasNarration": "আবৃত্তি আছে",

  // Piece apparatus --------------------------------------------------------
  // These four already existed in the markup as hardcoded Bengali; they are
  // moved here unchanged so switching to Bengali restores exactly the wording
  // readers already know.
  "piece.contents": "সূচিপত্র",
  "piece.filedUnder": "বিষয়সূত্র",
  "piece.timeline": "কালরেখা",
  "piece.sources": "তথ্যসূত্র",
  "piece.sourcesNote": "কোনও তথ্যে ভুল চোখে পড়লে জানাবেন — সংশোধন করে দেওয়া হবে।",

  "piece.fullTextBelow": "সম্পূর্ণ লেখা নিচে",
  "piece.reelExpanded": "রিলে যা বলা হয়েছে, তার সম্পূর্ণ লেখা নিচে",

  // English gets by with "Previous" / "Next" on their own; in Bengali the bare
  // adjective dangles, so the classifier comes along — the same asymmetry as
  // `authors.count` above.
  "piece.seriesNav": "ধারাবাহিকের কিস্তি",
  "piece.previous": "আগের কিস্তি",
  "piece.next": "পরের কিস্তি",

  // The letter (newsletter) ------------------------------------------------
  "letter.label": "চিঠি",
  "letter.blockTitle": "মাসে একটা চিঠি",
  "letter.blockBody":
    "নতুন লেখা, পুরোনো সংগ্রহ থেকে কিছু, আর যা পড়ছি তার হদিস। বিজ্ঞাপন নেই, সপ্তাহে তিনবার মেল নেই।",
  "letter.emailLabel": "ইমেল ঠিকানা",
  "letter.emailPlaceholder": "আপনার ইমেল",
  "letter.send": "পাঠান",
  "letter.footerPitch":
    "মাসে একটি চিঠি — নতুন লেখা, পড়ার সুপারিশ, আর যা লিখতে গিয়ে বাদ পড়ে গেল।",

  "letter.intro1":
    "মাসে একবার একটা চিঠি যায়। তাতে থাকে সেই মাসের নতুন লেখা, সংগ্রহ থেকে পুরোনো একটা কিছু যা আবার পড়ার মতো, আর যা পড়ছি তার হদিস।",
  "letter.intro2":
    "যা থাকে না: বিজ্ঞাপন, স্পনসর্ড লিংক, সপ্তাহে তিনটে মেল, আর “আপনি কি এখনও আছেন?” জাতীয় চিঠি। ইমেল ঠিকানা কাউকে দেওয়া হয় না, কোথাও বিক্রি হয় না।",
  "letter.intro3":
    "প্রতিটি চিঠির নিচে unsubscribe লিংক থাকে। একবার ক্লিকেই শেষ — কারণ জানতে চাওয়া হবে না।",

  // Unsubscribe ------------------------------------------------------------
  "letter.unsubEyebrow": "চিঠি বন্ধ",
  "letter.unsubTitle": "চিঠি বন্ধ করা",
  "letter.unsubNoToken":
    "লিংকে ঠিকানাটা খুঁজে পাওয়া গেল না। চিঠির নিচে যে “চিঠি বন্ধ করুন” লিংকটা আছে, সেটা থেকে আসলে কাজ করবে।",
  "letter.unsubAsk": "চিঠি পাওয়া বন্ধ করতে চাইলে নিচের বোতামটা একবার চাপুন।",
  "letter.unsubConfirm": "চিঠি বন্ধ করুন",
  "letter.unsubKeep": "থাক, চলুক",
  "letter.unsubAfter":
    "লেখা তো এখানেই থাকল। যখন ইচ্ছে হবে, পড়তে চলে আসবেন।",

  // System messages. These are the same sentences the API sends as `messageBn`;
  // they live here too so an English reader gets an English answer.
  "letter.msg.subscribed": "লেখা হয়ে গেল। মাসের চিঠি আপনার কাছে পৌঁছবে।",
  "letter.msg.invalidEmail": "সঠিক ইমেল ঠিকানা দিন।",
  "letter.msg.unreadable": "অনুরোধটি পড়া যাচ্ছে না।",
  "letter.msg.saveFailed": "এখন সংরক্ষণ করা যাচ্ছে না। একটু পরে চেষ্টা করুন।",
  "letter.msg.missingToken": "লিংকটি সম্পূর্ণ নয়।",
  "letter.msg.unknownToken": "এই লিংকটি আর কাজ করছে না।",
  "letter.msg.unsubscribed": "হয়ে গেল। আর চিঠি যাবে না।",
  "letter.msg.network": "সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করুন।",
  "letter.msg.failed": "কিছু ভুল হয়েছে। আবার চেষ্টা করুন।",

  // Shared verbs and small words ------------------------------------------
  "common.loadMore": "আরও দেখুন",
  "common.loading": "আসছে",
  "common.retry": "আবার চেষ্টা করুন",
  "common.save": "সংরক্ষণ",
  "common.cancel": "বাতিল",
  "common.edit": "সম্পাদনা",
  "common.delete": "মুছুন",
  "common.close": "বন্ধ",
  "common.back": "ফিরে যান",
  "common.all": "সব",
  "common.clear": "সাফ করুন",
  "common.share": "শেয়ার",
  "common.copy": "লিঙ্ক কপি",
  "common.copied": "কপি হয়েছে",
  "common.empty": "এখনও কিছু নেই।",
  // The caller passes `count` through `toBengaliNumber`, so the digits arrive
  // as ০–৯ already. This string only supplies the classifier.
  "common.count": "{count} টি লেখা",
} as const satisfies Dictionary;
