const ts = require('typescript');
const fs = require('node:fs');
const pages = {
  'src/app/contact/page.tsx': [
    'is an open editorial platform for Bengali literature, poetry, and documentaries. Contact us directly with questions, suggestions, reviews, or corrections to our sources.',
    'Editorial feedback and inquiries',
    'Every piece involves extensive research, manuscript reading, and source verification. If you notice a factual error or an incomplete source, please let us know so we can investigate and correct it.',
    'Ways to contact us',
    'Our main contact channels are our official Instagram messages and The Letter. Use the links below to get in touch:',
    'Editorial inquiries and sources', 'Security and privacy', 'Letters and feedback', 'Send feedback through The Letter',
  ],
  'src/app/privacy/page.tsx': [
    'believes in an independent, uninterrupted reading experience. We do not collect unnecessary personal information and treat reader privacy with the utmost respect.',
    '1. No account required',
    ' does not require a reader account to access writing, blogs, documentaries, series, or the timeline. All published literary content is open and immediately available to read.',
    '2. Browser storage (localStorage)',
    'When you bookmark a piece or your reading progress is recorded, that information is stored only in your own browser’s localStorage. It is not sent to our servers or made available to other people.',
    '3. Newsletter and email addresses',
    'If you voluntarily give us your email address for The Letter, we use it securely to send new writing and editorial notes. We do not sell, rent, or transfer these addresses to third parties. You can unsubscribe at any time using the link at the bottom of each letter.',
    '4. Analytics and cookies',
    'We use anonymized statistics to improve website performance and the reading experience. Our cookies support your chosen theme (tw_theme), language (tw_lang), and administrative security. We do not use advertising trackers or cookies for cross-site profiling.',
    '5. Data security, retention, and rights',
    'Our database and infrastructure use modern TLS/SSL encryption and security protocols. To request deletion of your information or ask about your data rights, email our security desk:',
    'or use our', 'contact page', 'to get in touch.',
    '6. Publication and legal identity',
    'is an independent digital platform for Bengali literature and research. We are not affiliated with any third-party advertising network.',
    'Last updated: September 2026 —', 'publication',
  ],
  'src/app/about/page.tsx': [
    'is an open digital publication and archive for Bengali literature, arts and culture, close reading, and documentary research.',
    'A social-media reel or short video may last a minute. The research, reading, drafts, and omitted passages behind it need more space than an Instagram or Facebook feed can offer.',
    'provides a permanent digital home for that complete reading experience.',
    'Our writing is organized into three main sections:', 'Writing',
    '— the complete original text behind every reel or video, without cuts or abridgment;', 'Blog',
    '— long-form, independent essays written for close reading rather than limited to a video; and', 'Documentary',
    '— videos accompanied by their complete timelines and documentary sources.',
    'Why we provide sources and references',
    'Much of the information about Bengali literature on the internet has no verifiable source. The publication, edition, and origin of a claim are often left unstated, allowing misinformation to circulate for years.',
    ' provides reliable bibliographies and references with its documentaries and research essays. If you notice an error, let us know and we will investigate and correct it.',
    'Reading comfort and accessibility',
    'Readers can adjust text size, line spacing, and the page’s color theme. Where narration is available, you can listen while browsing other writing. You can also save each piece as a printable PDF.',
    'No mandatory account is needed. Your Read later list is stored in your own browser.',
  ],
  'src/app/resource/bangla-sahityer-timeline/page.tsx': [
    'Home', 'Archive', 'Timeline of Bengali Literature', 'Special collection and guide · Thoughts Whatever Resource',
    'The Complete Timeline of Bengali Literature', '(1800 — 2025)',
    'From the beginnings of prose at Fort William College through the Bengal Renaissance, the Tagore era, Kallol modernism, and contemporary literature: a reference map of 225 years of Bengali literature, its historical contexts, and enduring works.',
    '225+ years', 'History of printing and literature', '6 eras', 'Major developments and periods',
    '25+ milestones', 'Novels, poetry, drama, and journals', 'Close reading', 'Links to documentaries and analysis',
    'Research and education (Cite this resource)', 'A reference for teachers, students, and researchers',
    'This timeline may be freely used and cited for university syllabuses, WBCS and other competitive examinations, and research in Bengali literature.',
    'Thoughts Whatever (2026). The Complete Timeline of Bengali Literature (1800–2025). thoughtswhatever.in/resource/bangla-sahityer-timeline',
  ],
  'src/components/resource/timeline-interactive.tsx': [
    'Clear', 'Found:', 'landmark events', 'Reset all filters', 'Author / creator:', 'Historical background and context:',
    'Key influences and features:', 'Thoughts Whatever in-depth analysis', 'Read and watch', 'Frequently asked questions',
    'Questions and answers about the history of Bengali literature',
    'Detailed explanations for university study, competitive examinations (WBCS), and readers interested in Bengali literature.',
  ],
};
const dictionary = {};
for (const [file, translations] of Object.entries(pages)) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), 99, true, ts.ScriptKind.TSX);
  const texts = [];
  function visit(node) {
    if (ts.isJsxText(node) && /[\u0980-\u09ff]/.test(node.text)) texts.push(node.text.replace(/\s+/g, ' ').trim().replaceAll('&ldquo;', '“').replaceAll('&rdquo;', '”').replaceAll('&amp;', '&'));
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (texts.length !== translations.length) throw Error(`${file}: ${texts.length} sources / ${translations.length} translations`);
  texts.forEach((text, index) => { dictionary[text] = translations[index]; });
}
Object.assign(dictionary, {
  'লেখক, বইয়ের নাম বা সাল খুঁজুন (যেমন: রবীন্দ্রনাথ, ১৮৬১, নীলদর্পণ)...': 'Search an author, book title, or year (e.g. Tagore, 1861, Nil Darpan)…',
  'সম্পূর্ণ তথ্যচিত্র ও পাঠ-পর্যালোচনা দেখুন': 'Explore the complete documentary and close reading',
  'খুঁজুন — লেখক, বিষয়, শিরোনাম…': 'Search — author, topic, title…',
  'লেখক, বিষয়, শিরোনাম…': 'Author, topic, title…',
  '১৫ সেকেন্ড পেছনে যান': 'Skip back 15 seconds', '১৫ সেকেন্ড সামনে যান': 'Skip forward 15 seconds',
  'গতি পরিবর্তন করুন': 'Change playback speed', 'শব্দ চালু করুন': 'Unmute', 'শব্দ মিউট করুন': 'Mute',
  'সব যুগ': 'All eras', 'গদ্যের সূচনা ও ফোর্ট উইলিয়াম': 'Early prose and Fort William',
  'বঙ্গীয় নবজাগরণ ও মহাকাব্য': 'Bengal Renaissance and epic poetry', 'রবীন্দ্র যুগ ও বিশ্বসাহিত্য': 'The Tagore era and world literature',
  'যুদ্ধোত্তর, দেশভাগ ও বাস্তববাদ': 'Postwar literature, Partition, and realism', 'সমকালীন ও ডিজিটাল যুগ': 'Contemporary and digital literature',
  '১৯৭০ — বর্তমান': '1970 — present',
  'পরে পড়ব — Thoughts Whatever': 'Read later — Thoughts Whatever',
  'Instagram — ইনস্টাগ্রাম': 'Instagram',
  'LISTEN · শুনুন →': 'Listen →',
  'READ BOOK · গ্রন্থ পাঠ করুন →': 'Read book →',
  'LISTEN AUDIO · অডিও শুনুন ও পাঠ করুন →': 'Listen to audio and read →',
  'পরে পড়ব — সংরক্ষিত': 'Read later — saved',
  'সংরক্ষিত': 'Saved',
  'গোপনীয়তা নীতি — Privacy Policy — Thoughts Whatever': 'Privacy Policy — Thoughts Whatever',
  'যোগাযোগ — Contact — Thoughts Whatever': 'Contact — Thoughts Whatever',
  'পরিচয় — About — Thoughts Whatever': 'About — Thoughts Whatever',
  'বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন (১৮০০–২০২৫) — ইতিহাস, যুগবিভাগ ও মাইলফলক — Thoughts Whatever': 'The Complete Timeline of Bengali Literature (1800–2025) — Thoughts Whatever',
});
fs.writeFileSync('locales/content-en.json', JSON.stringify(dictionary, null, 2) + '\n');
console.log(`Bundled ${Object.keys(dictionary).length} English passages and labels.`);
