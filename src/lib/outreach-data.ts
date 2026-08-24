export type ProspectCategory =
  | "academic"
  | "literary_magazine"
  | "cultural_society"
  | "exam_prep"
  | "book_community"
  | "history_heritage";

export type PitchStatus =
  | "not_contacted"
  | "pitch_sent"
  | "follow_up_1"
  | "follow_up_2"
  | "secured"
  | "declined";

export type ProspectPriority = "high" | "medium" | "quick_win";

export type BacklinkProspect = {
  id: string;
  name: string;
  domain: string;
  category: ProspectCategory;
  categoryLabelBn: string;
  targetUrl: string;
  targetPageNameBn: string;
  recommendedAnchorText: string;
  contactEmailOrUrl: string;
  contactPersonOrDept: string;
  priority: ProspectPriority;
  notes: string;
  defaultStatus?: PitchStatus;
};

export const PROSPECT_CATEGORIES: { id: ProspectCategory | "all"; label: string }[] = [
  { id: "all", label: "All Categories (সব ক্যাটাগরি)" },
  { id: "academic", label: "🎓 Universities & Academics" },
  { id: "literary_magazine", label: "📖 Literary Magazines & Webzines" },
  { id: "cultural_society", label: "🏛️ Cultural & Historical Societies" },
  { id: "exam_prep", label: "📝 WBCS & Exam Prep Portals" },
  { id: "book_community", label: "📚 Book Review & Reader Platforms" },
  { id: "history_heritage", label: "🌐 Heritage & Archive Circles" },
];

export const INITIAL_PROSPECTS: BacklinkProspect[] = [
  // ── 1. Academic & University Portals
  {
    id: "calcutta-univ-bengali",
    name: "Calcutta University — Department of Bengali Language & Literature",
    domain: "caluniv.ac.in",
    category: "academic",
    categoryLabelBn: "বিশ্ববিদ্যালয় ও অ্যাকাডেমিক",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন (১৮০০–২০২৫)",
    recommendedAnchorText: "বাংলা সাহিত্যের ১৮০০–২০২৫ কালানুক্রমিক টাইমলাইন ও প্রেক্ষাপট",
    contactEmailOrUrl: "bengali@caluniv.ac.in",
    contactPersonOrDept: "Department of Bengali / Web Coordinator",
    priority: "high",
    notes: "Department resource page for undergraduate & postgraduate literature students.",
  },
  {
    id: "jadavpur-univ-cl",
    name: "Jadavpur University — Comparative Literature & Bengali",
    domain: "jaduniv.edu.in",
    category: "academic",
    categoryLabelBn: "বিশ্ববিদ্যালয় ও অ্যাকাডেমিক",
    targetUrl: "https://thoughtswhatever.in/series/নীলদর্পণ",
    targetPageNameBn: "নীলদর্পণ তথ্যচিত্র ও বিচার বিশ্লেষণ",
    recommendedAnchorText: "Nil Darpan Historical Trial and Protest Analysis",
    contactEmailOrUrl: "complit@jadavpuruniversity.in",
    contactPersonOrDept: "Head, Dept of Comparative Literature",
    priority: "high",
    notes: "Great target for English abstract and Rev. James Long court trial research.",
  },
  {
    id: "visva-bharati-rabindra-bhavan",
    name: "Visva-Bharati University — Rabindra Bhavana",
    domain: "visvabharati.ac.in",
    category: "academic",
    categoryLabelBn: "বিশ্ববিদ্যালয় ও অ্যাকাডেমিক",
    targetUrl: "https://thoughtswhatever.in/series/চোখের-বালি",
    targetPageNameBn: "চোখের বালি মনস্তাত্ত্বিক বিশ্লেষণ",
    recommendedAnchorText: "চোখের বালি মনস্তাত্ত্বিক বিশ্লেষণ ও চরিত্র পরিচয়",
    contactEmailOrUrl: "rabindrabhavana@visva-bharati.ac.in",
    contactPersonOrDept: "Director, Rabindra Bhavana Archive",
    priority: "high",
    notes: "Perfect alignment with Rabindranath Tagore close readings.",
  },
  {
    id: "dhaka-univ-bangla",
    name: "University of Dhaka — Department of Bangla",
    domain: "du.ac.bd",
    category: "academic",
    categoryLabelBn: "বিশ্ববিদ্যালয় ও অ্যাকাডেমিক",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "বাংলা সাহিত্যের টাইমলাইন",
    recommendedAnchorText: "বাংলা সাহিত্যের কালানুক্রমিক মাইলফলক ও যুগবিভাগ",
    contactEmailOrUrl: "bangla@du.ac.bd",
    contactPersonOrDept: "Chairman, Department of Bangla",
    priority: "high",
    notes: "Cross-border academic resource sharing for undergraduate students.",
  },
  {
    id: "uchicago-southasia",
    name: "University of Chicago — South Asian Language & Civilizations",
    domain: "salc.uchicago.edu",
    category: "academic",
    categoryLabelBn: "বিশ্ববিদ্যালয় ও অ্যাকাডেমিক",
    targetUrl: "https://thoughtswhatever.in/series/মেঘনাদবধ-কাব্য",
    targetPageNameBn: "Meghnadbadh Kavya Analysis",
    recommendedAnchorText: "Meghnadbadh Kavya English abstract and poetic analysis",
    contactEmailOrUrl: "salc-dept@uchicago.edu",
    contactPersonOrDept: "Bengali Language Lecturer / Coordinator",
    priority: "medium",
    notes: "Offers Bengali language instruction; ideal for English abstracts and translations.",
  },
  {
    id: "soas-london-bengali",
    name: "SOAS University of London — South Asian Studies",
    domain: "soas.ac.uk",
    category: "academic",
    categoryLabelBn: "বিশ্ববিদ্যালয় ও অ্যাকাডেমিক",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "Timeline of Bengali Literature",
    recommendedAnchorText: "Timeline of Bengali Literature (1800-2025)",
    contactEmailOrUrl: "southasia@soas.ac.uk",
    contactPersonOrDept: "South Asian Studies Webmaster",
    priority: "medium",
    notes: "External resource recommendation on South Asian literary studies guide.",
  },

  // ── 2. Literary Magazines & Cultural Webzines
  {
    id: "parabaas-webzine",
    name: "Parabaas (পরবাস) — International Bengali Webzine",
    domain: "parabaas.com",
    category: "literary_magazine",
    categoryLabelBn: "সাহিত্য সাময়িকপত্র",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "বাংলা সাহিত্যের টাইমলাইন",
    recommendedAnchorText: "Thoughts Whatever — বাংলা সাহিত্যের আধুনিক টাইমলাইন ও তথ্যচিত্র",
    contactEmailOrUrl: "parabaas@parabaas.com",
    contactPersonOrDept: "Editorial Board, Parabaas",
    priority: "quick_win",
    notes: "High authority diaspora literary portal with curated web resource links.",
  },
  {
    id: "kaurab-journal",
    name: "Kaurab Online (কৌরব সাহিত্য)",
    domain: "kaurab.com",
    category: "literary_magazine",
    categoryLabelBn: "সাহিত্য সাময়িকপত্র",
    targetUrl: "https://thoughtswhatever.in/series/মেঘনাদবধ-কাব্য",
    targetPageNameBn: "মেঘনাদবধ কাব্য অমিত্রাক্ষর ছন্দ বিশ্লেষণ",
    recommendedAnchorText: "মেঘনাদবধ কাব্যের আধুনিক বিশ্লেষণ ও অমিত্রাক্ষর ছন্দ",
    contactEmailOrUrl: "editor@kaurab.com",
    contactPersonOrDept: "Kaurab Editorial Team",
    priority: "medium",
    notes: "Influential modernist literary journal in Bengal.",
  },
  {
    id: "kali-o-kolom",
    name: "Kali O Kolom (কালি ও কলম)",
    domain: "kaliokolom.com",
    category: "literary_magazine",
    categoryLabelBn: "সাহিত্য সাময়িকপত্র",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "বাংলা সাহিত্যের টাইমলাইন",
    recommendedAnchorText: "বাংলা সাহিত্যের যুগবিভাগ ও ডিজিটাল আর্কাইভ",
    contactEmailOrUrl: "info@kaliokolom.com",
    contactPersonOrDept: "Editor, Kali O Kolom",
    priority: "high",
    notes: "Premier Bengali monthly magazine of literature and the arts.",
  },
  {
    id: "sahitya-akademi-bengali",
    name: "Sahitya Akademi — National Academy of Letters",
    domain: "sahitya-akademi.gov.in",
    category: "literary_magazine",
    categoryLabelBn: "সাহিত্য সাময়িকপত্র",
    targetUrl: "https://thoughtswhatever.in/authors/জীবনানন্দ-দাশ",
    targetPageNameBn: "জীবনানন্দ দাশ সংগ্রহ",
    recommendedAnchorText: "জীবনানন্দ দাশ ও আধুনিক বাংলা কবিতা বিশ্লেষণ",
    contactEmailOrUrl: "secretary@sahitya-akademi.gov.in",
    contactPersonOrDept: "Bengali Advisory Board",
    priority: "medium",
    notes: "Authority citation in literary monographs and regional journals.",
  },

  // ── 3. Cultural & Historical Societies
  {
    id: "bangiya-sahitya-parishad",
    name: "Bangiya Sahitya Parishad (বঙ্গীয় সাহিত্য পরিষদ)",
    domain: "bangiyasahityaparishad.org",
    category: "cultural_society",
    categoryLabelBn: "সাংস্কৃতিক ও ঐতিহাসিক সমাজ",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন",
    recommendedAnchorText: "Thoughts Whatever বাংলা সাহিত্যের ইন্টারঅ্যাক্টিভ টাইমলাইন",
    contactEmailOrUrl: "contact@bangiyasahityaparishad.org",
    contactPersonOrDept: "Secretary / Library Committee",
    priority: "high",
    notes: "The historic cradle of Bengali manuscript preservation and renaissance records.",
  },
  {
    id: "asiatic-society-kolkata",
    name: "The Asiatic Society, Kolkata",
    domain: "asiaticsocietykolkata.org",
    category: "cultural_society",
    categoryLabelBn: "সাংস্কৃতিক ও ঐতিহাসিক সমাজ",
    targetUrl: "https://thoughtswhatever.in/series/নীলদর্পণ",
    targetPageNameBn: "নীলদর্পণ ও ১৯ শতকের বাংলা",
    recommendedAnchorText: "Nil Darpan and 19th-Century Bengal Social Protest Archive",
    contactEmailOrUrl: "theasiaticsociety@gmail.com",
    contactPersonOrDept: "General Secretary / Research Section",
    priority: "medium",
    notes: "Valuable resource for colonial-era literature documentation.",
  },

  // ── 4. WBCS & Competitive Exam Resource Hubs
  {
    id: "wbcs-study-circle",
    name: "WBCSMadeEasy & WBCS Preparation Hub",
    domain: "wbcsmadeeasy.in",
    category: "exam_prep",
    categoryLabelBn: "WBCS ও প্রতিযোগিতামূলক পরীক্ষা",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "বাংলা সাহিত্যের টাইমলাইন (১৮০০–২০২৫)",
    recommendedAnchorText: "WBCS বাংলা সাহিত্য অপশনাল: সম্পূর্ণ টাইমলাইন ও যুগবিভাগ নোটস",
    contactEmailOrUrl: "mailus@wbcsmadeeasy.in",
    contactPersonOrDept: "Content Head / Bengali Faculty",
    priority: "quick_win",
    notes: "High conversion for educational links — students need clear timelines for Optional Paper.",
  },
  {
    id: "testbook-bengali",
    name: "Testbook West Bengal Exam Notes",
    domain: "testbook.com",
    category: "exam_prep",
    categoryLabelBn: "WBCS ও প্রতিযোগিতামূলক পরীক্ষা",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "বাংলা সাহিত্যের ইতিহাস ও টাইমলাইন",
    recommendedAnchorText: "Bengali Literature Timeline & Critical Analysis",
    contactEmailOrUrl: "support@testbook.com",
    contactPersonOrDept: "Editorial Team (WBPSC Section)",
    priority: "medium",
    notes: "Suggestion for resource section in WBPSC Bengali literature guides.",
  },
  {
    id: "adda247-wb",
    name: "Adda247 Bengali Exam Prep Blog",
    domain: "adda247.com/bn",
    category: "exam_prep",
    categoryLabelBn: "WBCS ও প্রতিযোগিতামূলক পরীক্ষা",
    targetUrl: "https://thoughtswhatever.in/series/চোখের-বালি",
    targetPageNameBn: "চোখের বালি বিশ্লেষণ",
    recommendedAnchorText: "চোখের বালি উপন্যাসের চরিত্র ও ঐতিহাসিক তাৎপর্য",
    contactEmailOrUrl: "blogger@adda247.com",
    contactPersonOrDept: "Regional Content Lead",
    priority: "quick_win",
    notes: "Active blog producing daily study materials for West Bengal civil service exams.",
  },

  // ── 5. Book Review & Reader Platforms
  {
    id: "boi-porua-club",
    name: "Boi Porua (বই পড়ুয়া) Readers Club",
    domain: "facebook.com/groups/boiporua",
    category: "book_community",
    categoryLabelBn: "বই রিভিউ ও পাঠক সমাজ",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "বাংলা সাহিত্যের টাইমলাইন",
    recommendedAnchorText: "Thoughts Whatever বাংলা সাহিত্য টাইমলাইন",
    contactEmailOrUrl: "admin@boiporua.org",
    contactPersonOrDept: "Moderator / Founder",
    priority: "quick_win",
    notes: "Huge organic engagement among Bengali book lovers and essay readers.",
  },
  {
    id: "goodreads-bengali-lit",
    name: "Goodreads — Bengali Literature Society",
    domain: "goodreads.com/group/show/bengali",
    category: "book_community",
    categoryLabelBn: "বই রিভিউ ও পাঠক সমাজ",
    targetUrl: "https://thoughtswhatever.in/series/মেঘনাদবধ-কাব্য",
    targetPageNameBn: "মেঘনাদবধ কাব্য পূর্ণাঙ্গ সিরিজ",
    recommendedAnchorText: "Meghnadbadh Kavya In-Depth Analysis",
    contactEmailOrUrl: "group-moderator",
    contactPersonOrDept: "Group Moderator",
    priority: "medium",
    notes: "Pin resource link in group discussions and essential reading lists.",
  },

  // ── 6. Heritage & Archive Circles
  {
    id: "kolkata-heritage-walks",
    name: "Kolkata Heritage & Renaissance Chronicles",
    domain: "puronokolkata.com",
    category: "history_heritage",
    categoryLabelBn: "হেরিটেজ ও ঐতিহাসিক আলোচনা",
    targetUrl: "https://thoughtswhatever.in/series/নীলদর্পণ",
    targetPageNameBn: "নীলদর্পণ ও নীল বিদ্রোহের কলকাতা",
    recommendedAnchorText: "নীলদর্পণ নাটক ও উনিশ শতকের কলকাতার ঐতিহাসিক প্রেক্ষাপট",
    contactEmailOrUrl: "puronokolkata@gmail.com",
    contactPersonOrDept: "Editor / Heritage Researcher",
    priority: "quick_win",
    notes: "Covers 19th-century Calcutta history and theater history.",
  },
  {
    id: "bengal-renaissance-circle",
    name: "Bengal Renaissance Forum",
    domain: "bengalrenaissance.org",
    category: "history_heritage",
    categoryLabelBn: "হেরিটেজ ও ঐতিহাসিক আলোচনা",
    targetUrl: "https://thoughtswhatever.in/resource/bangla-sahityer-timeline",
    targetPageNameBn: "বাংলা সাহিত্যের টাইমলাইন (১৮০০–২০২৫)",
    recommendedAnchorText: "Bengal Renaissance Timeline & Key Literary Milestones",
    contactEmailOrUrl: "info@bengalrenaissance.org",
    contactPersonOrDept: "Curator",
    priority: "medium",
    notes: "Historic focus directly matching our Fort William & Renaissance chapters.",
  },
];

export const EMAIL_TEMPLATES = [
  {
    id: "academic_resource",
    title: "1. Academic Resource Recommendation (বিশ্ববিদ্যালয় / শিক্ষক)",
    subject: "Free Interactive Resource for Bengali Literature Curriculum — Complete 1800–2025 Timeline",
    body: `Respected Professor / Dear {{contact_person}},

I hope this email finds you well.

I am reaching out from Thoughts Whatever (thoughtswhatever.in), an independent digital research journal dedicated to close readings, historical contextualization, and documentary analysis of Bengali literature.

We recently developed a free, comprehensive, interactive timeline of Bengali literature spanning 1800 to 2025:
👉 {{target_url}}

Key highlights of this resource:
- Covers 225+ years of literary evolution across 6 distinct epochs (Fort William, Bengal Renaissance, Tagore Era, Post-War/Partition, and Contemporary literature).
- Detailed breakdown of 25+ seminal texts (including Nil Darpan, Meghnadbadh Kavya, Chokher Bali, and Padma Nadir Majhi) with historical trials, socio-political backdrops, and character analyses.
- Includes English critical abstracts for international and comparative literature students.

We thought this might be a valuable supplementary reference for students and faculty in your department ({{organization_name}}). If you find it helpful, please consider adding it to your department's study resources or recommended reading page.

Thank you for your time and your dedication to Bengali literary scholarship.

Warm regards,
Editorial Team | Thoughts Whatever
Website: https://www.thoughtswhatever.in
Instagram: @thoughts.whatever_`,
  },
  {
    id: "exam_prep_resource",
    title: "2. WBCS & Civil Services Exam Guide (পরীক্ষা পোর্টাল)",
    subject: "Resource Suggestion for WBCS Bengali Literature Optional Syllabus: Interactive 1800–2025 Timeline",
    body: `Hello {{contact_person}},

I noticed your excellent WBCS / competitive exam preparation resources on {{organization_name}}.

Many aspirants find memorizing the chronological evolution of Bengali literature, movements, and seminal publications challenging for the Bengali Optional paper.

To help students, Thoughts Whatever has published an open-access, interactive timeline mapping 225 years of Bengali literature with character guides, historical context, and FAQ breakdowns:
👉 {{target_url}}

Recommended anchor text: "{{recommended_anchor}}"

This clean, ad-free resource covers Fort William College, Bengal Renaissance, Kallol movement, and major novels in detail. Adding this link to your WBCS Bengali study material list would provide immense practical value to candidates.

Keep up the great work supporting students!

Best regards,
Thoughts Whatever
https://www.thoughtswhatever.in`,
  },
  {
    id: "literary_webzine",
    title: "3. Literary Webzine / Magazine Pitch (বাংলা সাহিত্য সাময়িকপত্র)",
    subject: "বাংলা সাহিত্য গবেষণা ও তথ্যচিত্র সংকলন — Thoughts Whatever সহযোগিতা",
    body: `শ্রদ্ধেয় {{contact_person}},

নমস্কার।

{{organization_name}}-এ আপনাদের নিয়মিত সাহিত্য চর্চা ও গুণগত প্রকাশনা অত্যন্ত প্রশংসনীয়।

বাংলা সাহিত্যের কালজয়ী সৃষ্টিগুলোর ঐতিহাসিক প্রেক্ষাপট, মনস্তাত্ত্বিক বিশ্লেষণ ও তথ্যচিত্রভিত্তিক পাঠ নিয়ে আমরা নিয়মিত কাজ করছি Thoughts Whatever (thoughtswhatever.in)-এ। 

সম্প্রতি আমরা ১৮০০ থেকে ২০২৫ সাল পর্যন্ত বাংলা সাহিত্যের ২২৫ বছরের সমগ্র পথচলা নিয়ে একটি পূর্ণাঙ্গ ইন্টারঅ্যাক্টিভ টাইমলাইন ও বিশেষ গবেষণা সংকলন প্রকাশ করেছি:
👉 {{target_url}}

আপনাদের মূল্যবান পোর্টালের রিসোর্স বা প্রাসঙ্গিক আলোচনা অংশে এই লিঙ্কটি অন্তর্ভুক্ত করলে বাংলা সাহিত্যের তরুণ পাঠক ও গবেষকদের জন্য তা বিশেষ সহায়ক হবে।

আন্তরিক শুভেচ্ছা সহ,
Thoughts Whatever সম্পাদনা দল
ওয়েবসাইট: https://www.thoughtswhatever.in`,
  },
  {
    id: "broken_link_replacement",
    title: "4. Resource / Context Enrichment Pitch",
    subject: "Supplementary Context on {{target_page_name}} for {{organization_name}}",
    body: `Hi {{contact_person}},

I was reading your insightful article/resource on {{organization_name}} regarding 19th/20th-century Bengali literature.

I noticed you mentioned the historical background of {{target_page_name}}. We recently published an in-depth documentary and critical analysis exploring the primary sources, trial transcripts, and historical context:
👉 {{target_url}}

If you ever update that page, linking to our analysis ("{{recommended_anchor}}") would give your readers an interactive, deeply-researched deep-dive into the piece.

Thank you for your valuable contributions to preserving literary history!

Warm regards,
Thoughts Whatever
https://www.thoughtswhatever.in`,
  },
];
