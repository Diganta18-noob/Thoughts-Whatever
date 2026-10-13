import en from "../../locales/en.json";
import bn from "../../locales/bn.json";
import content from "../../locales/content-en.json";

/** Reviewed website copy takes precedence over automatic translation. */
export const englishTranslations: Record<string, string> = Object.fromEntries(
  Object.entries(bn).map(([key, value]) => [value, en[key as keyof typeof en]]),
);
Object.assign(englishTranslations, {
  "পরে পড়ব": "Read later",
  "এই তালিকা আপনার নিজের ব্রাউজারে রাখা — আমাদের কাছে যায় না। তাই অন্য ফোনে বা অন্য ব্রাউজারে এটা দেখা যাবে না, আর ব্রাউজারের ডেটা মুছলে তালিকাও মুছে যাবে।": "This list is stored in your browser and is not sent to us. It will not appear on another device or browser, and clearing your browser data will remove it.",
  "এখনও কিছু সংরক্ষণ করা হয়নি।": "You have not saved anything yet.",
  "যেকোনও লেখার উপরে বুকমার্ক আইকনে ক্লিক করলে সেটা এখানে জমা থাকবে।": "Click the bookmark icon on any piece to save it here.",
  "যোগাযোগ": "Contact",
  "গোপনীয়তা নীতি": "Privacy Policy",
  "পরিচয়": "About",
  "সম্পাদকীয় ও তথ্যসূত্র": "Editorial inquiries and sources",
  "সুরক্ষা ও গোপনীয়তা": "Security and privacy",
  "চিঠি ও মতামত": "Letters and feedback",
  "নিউজলেটারের মাধ্যমে প্রতিক্রিয়া": "Send feedback through The Letter",
  "বাংলা সাহিত্য নিয়ে পূর্ণাঙ্গ লেখা, পাঠ-পর্যালোচনা ও তথ্যচিত্র। রিলের পিছনের সম্পূর্ণ রচনা ও গবেষণাপত্র।": "Full-length writing, close readings, and documentaries on Bengali literature. Explore the complete essays and research behind each reel.",
  "বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন": "The Complete Timeline of Bengali Literature",
  "নীড়পাতা": "Home",
  "সংগ্রহশালা": "Archive",
  "বাংলা সাহিত্যের টাইমলাইন": "Timeline of Bengali Literature",
  "সকল ধারা": "All categories",
  "উপন্যাস": "Novels",
  "কবিতা ও মহাকাব্য": "Poetry and epics",
  "নাটক": "Drama",
  "সাময়িকপত্র ও প্রবন্ধ": "Journals and essays",
  "আন্দোলন ও যুগবদল": "Movements and transitions",
  "মুছুন": "Clear",
  "পাওয়া গেছে:": "Found:",
  "টি যুগান্তকারী ঘটনা": "landmark events",
  "সব ফিল্টার রিসেট করুন": "Reset all filters",
  "ঐতিহাসিক পটভূমি ও প্রেক্ষাপট:": "Historical background and context:",
  "মূল প্রভাব ও উল্লেখযোগ্য বৈশিষ্ট্য:": "Key influences and features:",
  "লেখক / রূপকার:": "Author / creator:",
  "সংক্ষিপ্ত করুন": "Show less",
  "বিস্তারিত প্রেক্ষাপট দেখুন": "Explore the context",
  "পড়ুন ও দেখুন": "Read and watch",
});
Object.assign(englishTranslations, content);
