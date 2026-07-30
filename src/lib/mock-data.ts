import { Article, Category, Series, OverviewStats } from "@/types/database";

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "ইতিহাস ও ঐতিহ্য",
    slug: "history-heritage",
    description: "বাংলার প্রাচীন ইতিহাস, রাজবংশ, প্রত্নতাত্ত্বিক নিদর্শনের প্রামাণ্য কাহিনী।",
  },
  {
    id: "cat-2",
    name: "সাহিত্য ও দর্শন",
    slug: "literature-philosophy",
    description: "বাংলা সাহিত্যের কালজয়ী সৃষ্টি, রচয়িতা ও দার্শনিক চিন্তাধারার গভীর বিশ্লেষণ।",
  },
  {
    id: "cat-3",
    name: "সংস্কৃতি ও শিল্প",
    slug: "culture-art",
    description: "লোকশিল্প, লোকসঙ্গীত, নাট্যকলা ও বাঙালি সংস্কৃতির রূপরেখা।",
  },
  {
    id: "cat-4",
    name: "জীবনী ও ব্যক্তিত্ব",
    slug: "biography-personalities",
    description: "বাংলার পথপ্রদর্শক মহীয়সী ও মনীষীদের জীবনগাথা।",
  },
];

export const MOCK_SERIES: Series[] = [
  {
    id: "series-1",
    title: "বাংলার হারিয়ে যাওয়া দুর্গ",
    slug: "lost-forts-of-bengal",
    description: "সুলতানি ও মোগল আমলের বাংলার বিস্মৃত সামরিক স্থাপত্য এবং দুর্গের নেপথ্যের রক্তক্ষয়ী ইতিহাস।",
    thumbnail_url: "https://images.unsplash.com/photo-1590732414187-5763a8d4a6f9?auto=format&fit=crop&w=1200&q=80",
    total_parts: 3,
  },
  {
    id: "series-2",
    title: "রবীন্দ্রনাথ ও আধুনিকতা",
    slug: "rabindranath-and-modernity",
    description: "বিশ্বকবির সাহিত্যচিন্তায় ইউরোপীয় আধুনিকতাবাদ এবং বাঙালির আত্মপরিচয়ের উন্মেষ।",
    thumbnail_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
    total_parts: 2,
  },
  {
    id: "series-3",
    title: "ঐতিহাসিক নদী ও নগরী",
    slug: "historic-rivers-and-cities",
    description: "ভাগীরথী, পদ্মা ও মেঘনার অববাহিকায় গড়ে ওঠা প্রাচীন বাণিজ্যকেন্দ্রগুলির উত্থান-পতন।",
    thumbnail_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    total_parts: 2,
  },
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "সোনারগাঁও: ঈশা খাঁর রাজধানী ও মসলিনের গৌরবগাথা",
    slug: "sonar-gaon-isha-khan-capital-and-muslin",
    excerpt: "বারো ভূঁইয়ার প্রধান ঈশা খাঁর রাজধানী সোনারগাঁও কীভাবে বিশ্বজুড়ে ঢাকার মসলিন বস্ত্রের জন্য খ্যাতি লাভ করেছিল? জানুন তৎকালীন ইতিহাস ও পূর্ণাঙ্গ নথি।",
    content: `## সূচনা ও ঐতিহাসিক প্রেক্ষাপট

বাংলার ইতিহাসে সোনারগাঁও কেবল একটি প্রাচীন শহর নয়, এটি ছিল বাঙালি স্বাধিকার ও স্থাপত্যের অনন্য প্রতীক। ষোড়শ শতকে মোগল আগ্রাসনের মুখে বারো ভূঁইয়ার নেতা **ঈশা খাঁ** এই সোনারগাঁও থেকেই সার্বভৌম বাংলার প্রতিরোধ গড়ে তুলেছিলেন। 

মেঘনা নদীর অববাহিকায় অবস্থিত এই প্রাচীন নগরী একাধারে ছিল শক্তিশালী সামরিক দুর্গ এবং আন্তর্জাতিক সূতিবস্ত্র বাণিজ্যের কেন্দ্রবিন্দু।

![সোনারগাঁও পানাম নগরী](https://images.unsplash.com/photo-1590732414187-5763a8d4a6f9?auto=format&fit=crop&w=1200&q=80)

---

## ঈশা খাঁ ও বারো ভূঁইয়ার প্রতিরোধ

১৫৭৬ সালে রাজমহলের যুদ্ধে সুলতান দাউদ খান কররানির পতনের পর মোগলরা বাংলাকে সুবা মোগল সাম্রাজ্যের অন্তর্ভুক্ত করতে চায়। তবে ঈশা খাঁর নেতৃত্বে বাংলার স্বাধীন জমিদারেরা সংগঠিত হন।

> "সোনারগাঁও কেবল একটি মাটির দুর্গ ছিল না; এটি ছিল স্বাধীনচেতা বাঙালির আত্মমর্যাদার অটল প্রাচীর।" — প্রখ্যাত ইতিহাসবিদ ড. রফিকুল ইসলাম

### ঐতিহাসিক সময়রেখা:

1. **১৫৮৩ খ্রিষ্টাব্দ:** মোগল সেনাপতি শাহবাজ খানের বিরুদ্ধে নদীযুদ্ধে ঈশা খাঁর সাফল্য।
2. **১৫৯৫ খ্রিষ্টাব্দ:** মোগল সুবেদার মানসিংহ সোনারগাঁও আক্রমণের চেষ্টা করেন কিন্তু সফল হননি।
3. **১৫৯৯ খ্রিষ্টাব্দ:** ঈশা খাঁর মৃত্যুর পর সোনারগাঁওয়ের রাজনৈতিক সমীকরণ পরিবর্তিত হতে থাকে।

---

## সূক্ষ্মতার পরাকাষ্ঠা: কিংবদন্তির মসলিন

সোনারগাঁও ছিল বিশ্বের বিখ্যাত **'মসলিন'** কাপড়ের প্রধান উৎপাদনাঞ্চল। ঢাকাই মসলিন সম্পর্কে কথিত আছে:
* একটি ৫০ গজ দীর্ঘ মসলিন শাড়ি একটি আংটির মধ্য দিয়ে অনায়াসে অতিক্রম করতে পারত।
* প্রাতঃকালীন শিশিরে মসলিন বিছালে তা ঘাসের সাথে মিশে যেত, যাকে বলা হতো *'আব-ই-রোয়ান'* বা প্রবাহিত জল।

### মসলিনের ধ্বংসের কারণ:
শিল্প বিপ্লবের পর ব্রিটিশ ইস্ট ইন্ডিয়া কোম্পানি বিলাতি মিলের সুতা প্রসারের লক্ষ্যে বাংলার ঐতিহ্যবাহী তাঁতিদের ওপর অবর্ণনীয় নির্যাতন শুরু করে। শুল্কনীতি পরিবর্তন ও কাঁচামালের সংকটে বিলুপ্ত হয়ে যায় এই মহার্ঘ্য শিল্প।

---

## ইনস্টাগ্রাম রিল সম্পর্কিত ভিডিও তথ্য

আমাদের ইনস্টাগ্রাম পেজে এই রিলের সংক্ষেপটি দেখা গেছে। রিলটিতে যে তিনটি বিরল মানচিত্রের উল্লেখ রয়েছে, তা নিচে দেওয়া হলো:
- **১৫৫৮ সালের পোর্টোলান চার্ট** (পর্তুগিজ নাবিকদের অঙ্কিত)
- **রেনেলের বাংলা মানচিত্র (১৭৭৯)**

সম্পূর্ণ দৃশ্যচিত্র দেখতে নিচে লিঙ্কটি ব্যবহার করুন।`,
    thumbnail_url: "https://images.unsplash.com/photo-1590732414187-5763a8d4a6f9?auto=format&fit=crop&w=1200&q=80",
    instagram_link: "https://www.instagram.com/reel/C3x9L7pM102/",
    category_id: "cat-1",
    category: MOCK_CATEGORIES[0],
    series_id: "series-1",
    series: MOCK_SERIES[0],
    part_number: 1,
    published_at: "2026-07-28T10:00:00Z",
    is_published: true,
    is_featured: true,
    view_count: 1420,
    reading_time_minutes: 6,
    tags: ["ইতিহাস", "ঈশা খাঁ", "সোনারগাঁও", "মসলিন", "ডকুমেন্টারি"],
  },
  {
    id: "art-2",
    title: "মহাস্থানগড়: পুণ্ড্রবর্ধনের আড়াই হাজার বছরের ইতিহাস",
    slug: "mahasthangarh-pundravardhana-history",
    excerpt: "করতোয়া নদীর তীরে জেগে থাকা প্রাচীনতম নগরী মহাস্থানগড়। মৌর্য থেকে গুপ্ত আমলের সমৃদ্ধ প্রত্নতাত্ত্বিক ঐতিহ্য।",
    content: `## মহাস্থানগড়ের অতীত রহস্য

বগুড়া শহরের ১০ মাইল উত্তরে করতোয়া নদীর পশ্চিমে অবস্থিত **মহাস্থানগড়**। এটি প্রাচীন **পুণ্ড্রবর্ধন** রাজ্যের রাজধানী ছিল। খ্রিস্টপূর্ব তৃতীয় শতক থেকে ত্রয়োদশ শতক পর্যন্ত একটানা প্রায় দেড় হাজার বছর ধরে এটি একটি সমৃদ্ধ দুর্গনগরী হিসেবে বিদ্যমান ছিল।

![মহাস্থানগড় প্রত্নক্ষেত্র](https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80)

## ব্রাহ্মী শিলালিপি ও মৌর্য আমল

১৯৩১ সালে মহাস্থানগড়ে প্রাপ্ত শিলালিপিটি বাংলার প্রাচীনতম লিখিত দলিল। এতে ব্রাহ্মী হরফে পুণ্ড্রনগরের দুর্ভিক্ষ মোকাবেলায় শস্য ও অর্থ বরাদ্দের নির্দেশ লিপিবদ্ধ ছিল।

### দুর্গের স্থাপত্যশৈলী
* চতুর্ভুজাকৃতি প্রতিরক্ষামূলক ইট নির্মিত প্রাচীর।
* গড় পরিখা ও গুপ্ত সামরিক দরজা।
* পরশুরামের প্রাসাদ ও জিয়ৎ কুণ্ডের ঐতিহাসিক কিংবদন্তি।`,
    thumbnail_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
    instagram_link: "https://www.instagram.com/reel/C3x9L7pM103/",
    category_id: "cat-1",
    category: MOCK_CATEGORIES[0],
    series_id: "series-1",
    series: MOCK_SERIES[0],
    part_number: 2,
    published_at: "2026-07-25T14:30:00Z",
    is_published: true,
    is_featured: false,
    view_count: 980,
    reading_time_minutes: 5,
    tags: ["প্রত্নতত্ত্ব", "মহাস্থানগড়", "পুণ্ড্রবর্ধন", "প্রাচীন বাংলা"],
  },
  {
    id: "art-3",
    title: "গীতাঞ্জলি ও নোবেল বিজয়: রবীন্দ্রনাথের আত্মানুসন্ধান",
    slug: "gitanjali-nobel-prize-rabindranath-tagore",
    excerpt: "১৯১৩ সালে সাহিত্যে প্রথম এশীয় হিসেবে রবীন্দ্রনাথ ঠাকুরের নোবেল প্রাপ্তির পেছনের আত্মিক যাত্রা ও গীতাঞ্জলির কাব্যসুধা।",
    content: `## কাব্য থেকে বিশ্বমঞ্চে

১৯১২ সালে রবীন্দ্রনাথ ঠাকুর যখন লন্ডন অভিমুখে যাত্রা করেন, তখন তাঁর হাতে ছিল নিজ হাতে অনূদিত 'Song Offerings'। ডব্লিউ বি ইয়েটস এর ভূমিকা পাঠ করে মুগ্ধ হন এবং লন্ডন সাহিত্য সমাজে তোলপাড় সৃষ্টি হয়।

![রবীন্দ্রনাথ ঠাকুর গীতাঞ্জলি](https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80)

> "আমার মাথা নত করে দাও হে তোমার চরণধূলার তলে। সকল অহঙ্কার হে আমার ডুবাাও চোখের জলে।"

## নোবেল কমিটির প্রতিক্রিয়া
১৯১৩ সালের ১৫ই নভেম্বর সুইডিশ একাডেমি রবীন্দ্রনাথকে নোবেল পুরস্কারে ভূষিত করার সিদ্ধান্ত ঘোষণা করে। বিশ্বসাহিত্যে উন্মোচিত হয় এক নতুন দিগন্ত।`,
    thumbnail_url: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80",
    instagram_link: "https://www.instagram.com/reel/C3x9L7pM104/",
    category_id: "cat-2",
    category: MOCK_CATEGORIES[1],
    series_id: "series-2",
    series: MOCK_SERIES[1],
    part_number: 1,
    published_at: "2026-07-20T09:15:00Z",
    is_published: true,
    is_featured: true,
    view_count: 2150,
    reading_time_minutes: 7,
    tags: ["রবীন্দ্রনাথ", "গীতাঞ্জলি", "নোবেল", "সাহিত্য"],
  },
  {
    id: "art-4",
    title: "লালন সাঁই ও বাউল দর্শন: আত্মতত্ত্বের অমৃতবাণী",
    slug: "lalon-shah-and-baul-philosophy",
    excerpt: "ছেঁউড়িয়ার আখড়ায় লালনের সাধনা, মানবতাবাদী দর্শন এবং জাত-পাতহীন সমাজের ভাব বিপ্লব।",
    content: `## সব লোকে কয় লালন কি জাত সংসারে

"সব লোকে কয় লালন কি জাত সংসারে। লালন কয় জাতের কি রূপ দেখলাম না এই নজরে।।"

বাউল সম্রাট **লালন সাঁই** ছিলেন ধর্মীয় গোঁড়ামি ও সামাজিক ভেদাভেদের বিরুদ্ধে এক মহান আধ্যাত্মিক বিপ্লব। নদীয়া জেলার ছেঁউড়িয়ায় গড়ে ওঠা তাঁর আখড়া ছিল সকল ধর্মের সম্প্রীতির কেন্দ্র।

![লালন সাঁই ছেঁউড়িয়া](https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80)

### লালন দর্শনের মূল উপাদান:
1. **অহিঁসা ও মানবপ্রেম**
2. **দেহকেন্দ্রিক সাধনপ্রণালী**
3. **মনের মানুষ খোঁজার ব্যাকুলতা**`,
    thumbnail_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    instagram_link: "https://www.instagram.com/reel/C3x9L7pM105/",
    category_id: "cat-3",
    category: MOCK_CATEGORIES[2],
    series_id: undefined,
    published_at: "2026-07-18T16:45:00Z",
    is_published: true,
    is_featured: false,
    view_count: 1780,
    reading_time_minutes: 6,
    tags: ["লালন", "বাউল", "দর্শন", "সংস্কৃতি"],
  },
  {
    id: "art-5",
    title: "ভাগীরথীর তীরে গৌড় ও মুর্শিদাবাদ: নবাবী আমলের সূর্যস্ত",
    slug: "murshidabad-and-fall-of-nawab-siraj-ud-daulah",
    excerpt: "১৭৫৭ সালের পলাশীর প্রান্তর এবং মুর্শিদাবাদের হীরাঝিল প্রাসাদের নেপথ্য চক্রান্ত ও বাংলার স্বাধীনতা হরণ।",
    content: `## ১৭৫৭: পলাশীর ট্র্যাজেডি

মুর্শিদাবাদ ছিল স্বাধীন বাংলার শেষ স্বাধীন রাজধানী। নবাব সিরাজউদ্দৌলা, মীর জাফর ও ইস্ট ইন্ডিয়া কোম্পানির লর্ড ক্লাইভের মধ্যকার ঐতিহাসিক যুদ্ধ কেবল এক নবাবের পতন ছিল না, এটি ছিল সমগ্র ভারতীয় উপমহাদেশে ২০০ বছরের ঔপনিবেশিক শাসনের সূচনা।

![মুর্শিদাবাদ হাজারদুয়ারী](https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80)

## হাজারদুয়ারী প্রাসাদ ও স্থাপত্য

১৭ শতকে তৈরি হাজারদুয়ারী প্রাসাদে ১০০০টি দরজা রয়েছে যার মধ্যে ৯০০টিই কৃত্রিম। শত্রু বা আক্রমণকারীদের বিভ্রান্ত করতেই এই বিশেষ স্থাপত্যকৌশল ব্যবহৃত হয়েছিল।`,
    thumbnail_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    instagram_link: "https://www.instagram.com/reel/C3x9L7pM106/",
    category_id: "cat-1",
    category: MOCK_CATEGORIES[0],
    series_id: "series-3",
    series: MOCK_SERIES[2],
    part_number: 1,
    published_at: "2026-07-12T11:20:00Z",
    is_published: true,
    is_featured: false,
    view_count: 1350,
    reading_time_minutes: 8,
    tags: ["মুর্শিদাবাদ", "সিরাজউদ্দৌলা", "পলাশী", "ইতিহাস"],
  },
];

export const MOCK_OVERVIEW_STATS: OverviewStats = {
  totalViews: 12480,
  totalArticles: MOCK_ARTICLES.length,
  totalSeries: MOCK_SERIES.length,
  totalSubscribers: 342,
  instagramClicks: 1890,
  avgReadingTimeMinutes: 5.4,
  recentViewsTrend: [
    { date: "২৪ জুলাই", views: 980, instagramClicks: 140 },
    { date: "২৫ জুলাই", views: 1120, instagramClicks: 165 },
    { date: "২৬ জুলাই", views: 1450, instagramClicks: 210 },
    { date: "২৭ জুলাই", views: 1300, instagramClicks: 195 },
    { date: "২৮ জুলাই", views: 1890, instagramClicks: 290 },
    { date: "২৯ জুলাই", views: 2100, instagramClicks: 320 },
    { date: "৩০ জুলাই", views: 2400, instagramClicks: 370 },
  ],
  topArticles: MOCK_ARTICLES.slice(0, 4),
};
