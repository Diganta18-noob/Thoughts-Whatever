export type CharacterProfile = {
  nameBn: string;
  nameEn: string;
  roleBn: string;
  significanceBn: string;
  quoteOrTraitBn?: string;
};

export type SeriesEnhancement = {
  slug: string;
  englishTitle: string;
  englishAuthor: string;
  englishAbstract: {
    overview: string;
    historicalImportance: string;
    literarySignificance: string;
  };
  historicalContext: {
    titleBn: string;
    periodBn: string;
    narrativeBn: string;
    keyFactsBn: string[];
  };
  characters: CharacterProfile[];
  faqs: {
    question: string;
    answer: string;
  }[];
  timelineAnchor: string;
  timelineEraLabelBn: string;
};

export const SERIES_ENHANCEMENTS: Record<string, SeriesEnhancement> = {
  "নীলদর্পণ": {
    slug: "নীলদর্পণ",
    englishTitle: "Nil Darpan (The Indigo Planting Mirror)",
    englishAuthor: "Dinabandhu Mitra (1860)",
    englishAbstract: {
      overview:
        "Nil Darpan is a seminal 1860 Bengali play by Dinabandhu Mitra that exposed the brutal exploitation and torture of Bengali peasants (ryots) by British indigo planters during the 19th-century colonial rule.",
      historicalImportance:
        "Written against the backdrop of the 1859–60 Indigo Revolt (Nil Bidroho), it galvanized public outrage in Calcutta and England. Its English translation by Michael Madhusudan Datta, published by Rev. James Long, led to Long's historic trial and imprisonment, cementing the play as India's foremost work of theatrical resistance.",
      literarySignificance:
        "Nil Darpan pioneered social realism and anti-colonial protest theater in India, opening the doors for the establishment of the National Theatre (Jatiya Natyashala) in Calcutta in 1872.",
    },
    historicalContext: {
      titleBn: "নীল বিদ্রোহ (১৮৫৯–৬০) ও নীলদর্পণ মামলার ঐতিহাসিক পটভূমি",
      periodBn: "ঊনবিংশ শতক · ঔপনিবেশিক বাংলা (১৮৫৯–১৮৭২)",
      narrativeBn:
        "১৮৫৯-৬০ সালে নদীয়া, যশোর, পাবনা ও চব্বিশ পরগনার কৃষকেরা ইউরোপীয় নীলকরদের দাদন প্রথা ও জবরদস্তিমূলক নীলচাষের বিরুদ্ধে ঐক্যবদ্ধ বিদ্রোহ ঘোষণা করে। সরকারি কর্মকর্তা দীনবন্ধু মিত্র ছদ্মনামে এই নাটকটি ঢাকা থেকে প্রকাশ করেন। রেভারেন্ড জেমস লং এটি মাইকেল মধুসূদন দত্তকে দিয়ে ইংরেজিতে অনুবাদ করান এবং ইংল্যান্ডের পার্লামেন্টে পাঠান। নীলকরদের মামলার প্রেক্ষিতে সুপ্রিম কোর্টে জেমস লং-এর এক মাসের কারাদণ্ড ও এক হাজার টাকা জরিমানা হয়, যা তৎক্ষণাৎ কালীপ্রসন্ন সিংহ আদালতে পরিশোধ করেন।",
      keyFactsBn: [
        "১৮৬০ সালে ঢাকা থেকে দীনবন্ধু মিত্র ছদ্মনামে নাটকটি প্রথম প্রকাশ করেন",
        "১৮৬১ সালে রেভারেন্ড জেমস লং-এর ঐতিহাসিক বিচার ও কারাদণ্ড ঘটে",
        "১৮৭২ সালের ৭ ডিসেম্বর জাতীয় নাট্যশালার প্রথম বাণিজ্যিক প্রযোজনা হিসেবে নীলদর্পণ মঞ্চস্থ হয়",
        "কালীপ্রসন্ন সিংহ আদালতে রেভারেন্ড লং-এর জরিমানার ১,০০০ টাকা তৎক্ষণাৎ প্রদান করেন",
      ],
    },
    characters: [
      {
        nameBn: "তোরাপ",
        nameEn: "Torap",
        roleBn: "বিদ্রোহী কৃষক ও অন্যায়ের বিরুদ্ধে আপসহীন কণ্ঠস্বর",
        significanceBn:
          "বাংলা নাট্যসাহিত্যের প্রথম অকুতোভয় মেহনতি কৃষক চরিত্র, যে প্রাণের মায়া ত্যাগ করে অন্যায়ের বিরুদ্ধে রুখে দাঁড়ায়।",
        quoteOrTraitBn: "লাঠির আঘাতে নীলকরদের কারাগার ভেঙে ক্ষেত্রমণিকে উদ্ধারকারী বীর চরিত্র",
      },
      {
        nameBn: "গোলকচন্দ্র বসু",
        nameEn: "Golak Basu",
        roleBn: "গ্রামের সজ্জন প্রবীণ গৃহস্থ",
        significanceBn:
          "ঔপনিবেশিক বিচারব্যবস্থার অন্যায় অপমানে জেলখানায় আত্মহত্যাকারী ঐতিহ্যবাহী বাঙালি সমাজের অসহায় প্রতীক।",
      },
      {
        nameBn: "নবীনমাধব",
        nameEn: "Nabinmadhab",
        roleBn: "গোলক বসুর জ্যেষ্ঠ পুত্র ও প্রতিবাদী যুবক",
        significanceBn:
          "আইন ও ন্যায়ের পথে নীলকরদের বিরুদ্ধে লড়াই করতে গিয়ে চরম নির্যাতনের শিকার হয়ে মৃত্যুবরণকারী ট্র্যাজিক নায়ক।",
      },
      {
        nameBn: "ক্ষেত্রমণি",
        nameEn: "Khetramoni",
        roleBn: "কৃষককন্যা ও সতীত্বের অপরাজেয় প্রতীক",
        significanceBn:
          "নীলকর সাহেবদের লালসা ও পাশবিক অত্যাচারের বিরুদ্ধে গ্রামীণ বাঙালি নারীর অদম্য আত্মমর্যাদার প্রতীক।",
      },
      {
        nameBn: "উড ও রোগ সাহেব",
        nameEn: "Mr. Wood & Mr. Rogue",
        roleBn: "ঔপনিবেশিক নীলকর কুঠিয়াল ও শোষক",
        significanceBn:
          "ব্রিটিশ সাম্রাজ্যবাদের অমানবিক লোভ, পুলিশ-প্রশাসনের পক্ষপাতিত্ব ও জবরদস্তির মূর্ত রূপ।",
      },
    ],
    faqs: [
      {
        question: "নীলদর্পণ নাটকটি কে এবং কখন রচনা করেন?",
        answer:
          "নীলদর্পণ নাটকটি দীনবন্ধু মিত্র ১৮৬০ সালে ঢাকা থেকে ছদ্মনামে প্রকাশ করেন। নাটকটি নদীয়া ও যশোরের নীলচাষীদের ওপর ব্রিটিশ নীলকরদের অমানুষিক অত্যাচারের পটভূমিতে রচিত।",
      },
      {
        question: "নীলদর্পণ নাটকের ইংরেজি অনুবাদ ও ঐতিহাসিক মামলা কী ছিল?",
        answer:
          "রেভারেন্ড জেমস লং-এর পৃষ্ঠপোষকতায় মাইকেল মধুসূদন দত্ত নাটকটি ইংরেজিতে অনুবাদ করেন। অনুবাদটি প্রকাশের পর ব্রিটিশ নীলকর সমিতি রেভারেন্ড লং-এর বিরুদ্ধে মানহানির মামলা করে। ১৮৬১ সালে কলকাতা সুপ্রিম কোর্ট জেমস লং-কে ১ মাসের কারাদণ্ড ও ১,০০০ টাকা জরিমানা করে।",
      },
      {
        question: "তোরাপ চরিত্রটির সাহিত্যিক ও রাজনৈতিক গুরুত্ব কী?",
        answer:
          "তোরাপ বাংলা নাট্যসাহিত্যের অন্যতম শ্রেষ্ঠ চরিত্র। সে কোনো আদর্শবাদী তাত্ত্বিক নয়, বরং মাটির মানুষ যার মধ্যে অসীম সাহস, গভীর মানবিকতা ও অন্যায়ের বিরুদ্ধে সশস্ত্র প্রতিরোধ গড়ে তোলার আপসহীন শক্তি রয়েছে।",
      },
      {
        question: "নীলদর্পণ কীভাবে ভারতীয় থিয়েটারের ইতিহাস বদলে দিয়েছিল?",
        answer:
          "১৮৭২ সালের ৭ ডিসেম্বর কলকাতার জোড়াসাঁকোর ন্যাশনাল থিয়েটারে সাধারণ দর্শকদের জন্য প্রথম টিকিট কেটে নাটক হিসেবে নীলদর্পণ মঞ্চস্থ হয়। এর অভূতপূর্ব জনপ্রিয়তা ও গণজাগরণ দেখে ব্রিটিশ সরকার ১৮৭৬ সালে ড্রামাটিক পারফরম্যান্সেস অ্যাক্ট (নাট্য নিয়ন্ত্রণ আইন) জারি করতে বাধ্য হয়।",
      },
    ],
    timelineAnchor: "nildarpan-1860",
    timelineEraLabelBn: "বঙ্গীয় নবজাগরণ ও মহাকাব্যের যুগ (১৮৫০–১৯০০)",
  },

  "মেঘনাদবধ-কাব্য": {
    slug: "মেঘনাদবধ-কাব্য",
    englishTitle: "Meghnadbadh Kavya (The Slaying of Meghnad)",
    englishAuthor: "Michael Madhusudan Datta (1861)",
    englishAbstract: {
      overview:
        "Meghnadbadh Kavya is the crowning achievement of modern Bengali epic poetry, written in nine cantos in 1861 by Michael Madhusudan Datta.",
      historicalImportance:
        "It dismantled traditional poetic conventions by introducing blank verse (Amitrakshar Chhanda) into Bengali literature and radically reimagining the Ramayana. Datta inverted traditional heroic archetypes, portraying Ravana and Meghnad as patriotic tragic heroes defending their motherland against invading forces.",
      literarySignificance:
        "Combining the grand epic traditions of Milton, Homer, Virgil, and Valmiki, this masterpiece marked the zenith of individualist humanist consciousness in the 19th-century Bengal Renaissance.",
    },
    historicalContext: {
      titleBn: "অমিত্রাক্ষর ছন্দের বিপ্লব ও মহাকাব্যের নবজন্ম",
      periodBn: "ঊনবিংশ শতক · বঙ্গীয় নবজাগরণের স্বর্ণযুগ (১৮৬১)",
      narrativeBn:
        "১৮৬১ সালে কোলকাতায় প্রকাশিত হয় মাইকেল মধুসূদন দত্তের কালজয়ী মহাকাব্য 'মেঘনাদবধ কাব্য'। মধ্যযুগীয় পয়ারের চৌদ্দমাত্রিক অন্ত্যমিলের নিগড় ভেঙে তিনি অমিত্রাক্ষর ছন্দ আবিষ্কার করেন, যা বাংলা কবিতাকে নাটকীয় গতি ও মহাকাব্যিক গাম্ভীর্য এনে দেয়। মিল্টনের 'প্যারাডাইস লস্ট'-এর শয়তানের বিদ্রোহী মহিমা এবং হোমারের ইলিয়াডের বীরত্বগাথাকে তিনি রামায়ণের লঙ্কাকাণ্ডের সঙ্গে সমন্বিত করেন।",
      keyFactsBn: [
        "নয়টি সর্গে বিভক্ত বাংলা সাহিত্যের প্রথম সার্থক ও পূর্ণাঙ্গ মহাকাব্য",
        "অমিত্রাক্ষর ছন্দ (Blank Verse) বাংলা কাব্যে মুক্তির বিপ্লব আনে",
        "রাবণ ও মেঘনাদকে দেশপ্রেমিক বীর ও ট্র্যাজিক নায়ক হিসেবে রূপায়ন",
        "বঙ্কিমচন্দ্র এই কাব্য সম্পর্কে লিখেছিলেন—'মেঘনাদবধ কাব্য বঙ্গভাষায় দ্বিতীয় নাই'",
      ],
    },
    characters: [
      {
        nameBn: "রাবণ",
        nameEn: "Ravana",
        roleBn: "লঙ্কার রাজা, পুত্রশোকে মুহ্যমান পিতা ও ট্র্যাজিক বীর",
        significanceBn:
          "ঐতিহ্যবাহী অসুর রূপের বদলে আত্মমর্যাদাসম্পন্ন দেশপ্রেমিক নৃপতি ও স্নেহময় পিতা রূপে চিত্রিত।",
        quoteOrTraitBn: "বিদ্রোহী পৌরুষ, ভাগ্যাহত ট্র্যাজেডি ও গভীর পিতা-হৃদয়",
      },
      {
        nameBn: "মেঘনাদ (ইন্দ্রজিৎ)",
        nameEn: "Meghnad (Indrajit)",
        roleBn: "লঙ্কার রাজকুমার ও অপরাজেয় সেনাপতি",
        significanceBn:
          "নিকুম্ভিলা যজ্ঞাগারে নিরস্ত্র অবস্থায় লক্ষ্মণের অন্যায় আক্রমণে নিহত হওয়া বাংলা সাহিত্যের অন্যতম করুণ শহীদ রূপক।",
      },
      {
        nameBn: "প্রমিলা",
        nameEn: "Pramila",
        roleBn: "মেঘনাদের বীরাঙ্গনা স্ত্রী",
        significanceBn:
          "বাংলা কাব্যের প্রথম তেজস্বিনী বীরাঙ্গনা নারী, যে একাকী রামের অবরোধ ভেদ করে লঙ্কাপুরীতে বীরদর্পে প্রবেশ করে।",
      },
      {
        nameBn: "চিত্রাঙ্গদা",
        nameEn: "Chitrangada",
        roleBn: "রাবণের প্রথমা মহিষী ও বীরবাহুর জননী",
        significanceBn:
          "যুদ্ধোন্মাদনার বিরুদ্ধে মাতৃহৃদয়ের সুতীব্র হাহাকার ও শান্তি কামনার প্রতীক।",
      },
    ],
    faqs: [
      {
        question: "মেঘনাদবধ কাব্য কয়টি সর্গে বিভক্ত এবং এর মূল কাহিনী কী?",
        answer:
          "মেঘনাদবধ কাব্য নয়টি সর্গে বিভক্ত। রামায়ণের লঙ্কাকাণ্ডের শেষ তিন দিন ও দুই রাতের ঘটনা—বীরবাহুর মৃত্যু থেকে শুরু করে মেঘনাদের বধ ও রাবণের শেষ অন্ত্যেষ্টিক্রিয়া পর্যন্ত এর আখ্যানবস্তু।",
      },
      {
        question: "অমিত্রাক্ষর ছন্দ (Blank Verse) কী এবং মধুসূদন কীভাবে এটি আবিষ্কার করেন?",
        answer:
          "অমিত্রাক্ষর ছন্দ হলো অন্ত্যমিলহীন প্রবহমান চৌদ্দমাত্রিক ছন্দ। মধুসূদন ইংরেজি ব্ল্যাঙ্ক ভার্স ও মিল্টনের প্যারাডাইস লস্ট দ্বারা অনুপ্রাণিত হয়ে পয়ারের চরণান্তিক মিল ভেঙে ভাবের প্রবাহকে পরবর্তী চরণে বিস্তৃত করার এই ছন্দ আবিষ্কার করেন।",
      },
      {
        question: "মধুসূদন রাবণ ও রামচন্দ্রের চরিত্রে কী মৌলিক পরিবর্তন এনেছেন?",
        answer:
          "মধুসূদন সনাতনী ধার্মিক দৃষ্টিভঙ্গি উল্টে দিয়ে রাবণ ও মেঘনাদকে বিদেশি আক্রমণকারীদের বিরুদ্ধে নিজ মাতৃভূমি রক্ষাকারী দেশপ্রেমিক মানবতাবাদী বীর হিসেবে দেখিয়েছেন। অপরদিকে রাম ও লক্ষ্মণকে দৈব সহায়তাপ্রাপ্ত এবং নিকুম্ভিলা যজ্ঞাগারে ছলনার আশ্রয় গ্রহণকারী হিসেবে উপস্থাপন করেছেন।",
      },
      {
        question: "প্রমিলা চরিত্রটির অভিনবত্ব কোথায়?",
        answer:
          "প্রমিলা বাংলা সাহিত্যের প্রথম বীরাঙ্গনা চরিত্র। তিনি ভারতীয় পৌরাণিক সনাতনী অবলা নারীর ছক ভেঙে অস্ত্রহাতে নারীসৈন্য পরিচালনা করেন এবং রামচন্দ্রের শিবির নির্ভয়ে অতিক্রম করে বীরপতির পাশে দাঁড়ান।",
      },
    ],
    timelineAnchor: "meghnadbadh-1861",
    timelineEraLabelBn: "বঙ্গীয় নবজাগরণ ও মহাকাব্যের যুগ (১৮৫০–১৯০০)",
  },

  "চোখের-বালি": {
    slug: "চোখের-বালি",
    englishTitle: "Chokher Bali (A Grain of Sand)",
    englishAuthor: "Rabindranath Tagore (1903)",
    englishAbstract: {
      overview:
        "Chokher Bali is Rabindranath Tagore's groundbreaking 1903 masterpiece, widely recognized as the first modern psychological novel in Indian literature.",
      historicalImportance:
        "Departing from the historical and romantic plots of the 19th century, Tagore directed the lens inwards into human psychology, examining forbidden desires, repression, ego, and the social disenfranchisement of young Hindu widows in conservative colonial Bengal.",
      literarySignificance:
        "Through the iconic and fiercely intelligent character of Binodini, Tagore created one of the most complex, rebellious, and nuanced female protagonists in world literature.",
    },
    historicalContext: {
      titleBn: "বাংলা উপন্যাসে মনস্তাত্ত্বিক আধুনিকতার সূত্রপাত",
      periodBn: "বিংশ শতকের সূচনা · রবীন্দ্র যুগ (১৯০৩)",
      narrativeBn:
        "১৯০৩ সালে 'বঙ্গদর্শন' পত্রিকায় প্রকাশিত হয় রবীন্দ্রনাথের 'চোখের বালি'। এর আগে বাংলা উপন্যাসে বাইরের ঘটনাবহুলতা, রোমাঞ্চ ও ঐতিহাসিক আখ্যানের প্রাধান্য ছিল। রবীন্দ্রনাথ চোখের বালির সূচনায় লিখেছিলেন—'উপন্যাসে ঘটনাপরম্পরার চেয়ে মনের ভিতরের আবর্ত বেশি প্রাধান্য পাইবার দিন আসিয়াছে।' বিনোদিনী, মহেন্দ্র, আশা ও বিহারীর জটিল চারকোণা সম্পর্কের মধ্য দিয়ে তিনি প্রচলিত সমাজরীতি ও হিন্দু বিধবার মানবেতর অবস্থানের নির্মম সত্য উন্মোচন করেন।",
      keyFactsBn: [
        "বাংলা সাহিত্যের প্রথম সফল ও সার্থক মনস্তাত্ত্বিক উপন্যাস",
        "বিনোদিনী চরিত্র বাংলা উপন্যাসের প্রথম তীব্র আত্মসচেতন ও বিদ্রোহী নারী",
        "বিধবা নারীর অবদমিত কামনা, আত্মমর্যাদা ও অধিকারের প্রথম মনস্তাত্ত্বিক বিশ্লেষণ",
        "ঋতুপর্ণ ঘোষের পরিচালনায় ঐশ্বরিয়া রাই অভিনীত আন্তর্জাতিক চলচ্চিত্র রূপান্তর লাভ করে",
      ],
    },
    characters: [
      {
        nameBn: "বিনোদিনী",
        nameEn: "Binodini",
        roleBn: "শিক্ষিতা, তীক্ষ্ণ বুদ্ধিসম্পন্ন ও বিদ্রোহী তরুণী বিধবা",
        significanceBn:
          "বাংলা কথাসাহিত্যের সবচেয়ে বৈপ্লবিক নারী চরিত্র—যে বঞ্চনার বিরুদ্ধে দাঁড়িয়ে নিজের বুদ্ধিমত্তা ও সৌন্দর্য দিয়ে সমাজকে চ্যালেঞ্জ জানায়।",
        quoteOrTraitBn: "আত্মমর্যাদাসম্পন্ন, জটিল, অপ্রতিরোধ্য ও গভীর মনস্তত্ত্বের আধার",
      },
      {
        nameBn: "মহেন্দ্র",
        nameEn: "Mahendra",
        roleBn: "স্বার্থপর, আত্মকেন্দ্রিক ও ভোগবাদী নবীন চিকিৎসক",
        significanceBn:
          "মাতৃস্নেহে অন্ধ ও প্রবৃত্তির দাস পুরুষ চরিত্রের প্রতীক, যে নিজের ভুলে সাজানো সংসার ধ্বংস করে।",
      },
      {
        nameBn: "বিহারী",
        nameEn: "Bihari",
        roleBn: "আদর্শবাদী, নিঃস্বার্থ ও কর্মনিষ্ঠ বন্ধু",
        significanceBn:
          "উপন্যাসের নৈতিক বিবেক—যে বিনোদিনীর আত্মাকে বুঝতে পেরেছিল এবং সামাজিক সংকীর্ণতার ঊর্ধ্বে ওঠার সাহস দেখিয়েছিল।",
      },
      {
        nameBn: "আশালতা",
        nameEn: "Ashalata",
        roleBn: "সরলমনা, অনাড়ম্বর গৃহবধূ",
        significanceBn:
          "প্রতারণার আগুনে পুড়ে নিষ্পাপ বালিকা থেকে আত্মনির্ভরশীল গৃহিণীতে রূপান্তরিত হওয়া চরিত্র।",
      },
    ],
    faqs: [
      {
        question: "চোখের বালি কেন বাংলা সাহিত্যের প্রথম মনস্তাত্ত্বিক উপন্যাস?",
        answer:
          "কারণ এই উপন্যাসে বাইরের কোনো নাটকীয় যুদ্ধ, হত্যা বা অলৌকিক ঘটনা নেই। সমস্ত সংঘাত ও আখ্যান মানুষের অন্তর্জগতের ঈর্ষা, কাম, আত্মগ্লানি, অহংকার ও চারিত্রিক টানাপোড়েনের মনস্তাত্ত্বিক বিশ্লেষণের উপর প্রতিষ্ঠিত।",
      },
      {
        question: "বিনোদিনী চরিত্রটি ভারতীয় সাহিত্যে কেন এত বৈপ্লবিক?",
        answer:
          "তৎকালীন উনিশ শতকীয় সমাজে হিন্দু বিধবাদের নিঃশব্দে আত্মত্যাগ ও শুষ্ক ব্রতপালন করতে হতো। বিনোদিনী প্রথম বিধবা চরিত্র যে তার শিক্ষা, রূপ ও বুদ্ধিমত্তা সম্পর্কে সচেতন এবং সমাজে নিজের ন্যায্য অধিকার ও ভালোবাসার দাবি জানায়।",
      },
      {
        question: "চোখের বালি নামকরণের তাৎপর্য কী?",
        answer:
          "বিনোদিনী ও আশালতা নিজেদের সখীত্বের শুরুতে ভালোবেসে একে অপরকে 'চোখের বালি' বলে ডাকত। কিন্তু পরবর্তীতে বিনোদিনীর উপস্থিতিই তাদের দাম্পত্য জীবনের সবচেয়ে যন্ত্রণাদায়ক অস্বস্তি ও অন্ধকারের কারণ হয়ে ওঠে, যা নামকরণের রূপক অর্থকে পূর্ণ করে।",
      },
      {
        question: "উপন্যাসের পরিণতিতে বিনোদিনী কেন বিহারীর বিবাহের প্রস্তাব প্রত্যাখ্যান করে?",
        answer:
          "বিনোদিনী জানত তৎকালীন গোঁড়া সমাজে বিধবা বিবাহ করলে বিহারীর মহৎ সামাজিক কর্মজীবন ও আত্মমর্যাদা ক্ষুণ্ণ হবে। তাই সে বিহারীর প্রতি নিঃস্বার্থ ভালোবাসা ও নিজের আত্মসম্মান অক্ষুণ্ন রেখে একা কাশীবাসের সিদ্ধান্ত নেয়।",
      },
    ],
    timelineAnchor: "chokher-bali-1903",
    timelineEraLabelBn: "রবীন্দ্র যুগ ও বিশ্বসাহিত্য (১৯০০–১৯৪১)",
  },

  "আনন্দমঠ": {
    slug: "আনন্দমঠ",
    englishTitle: "Anandamath (The Abbey of Bliss)",
    englishAuthor: "Bankim Chandra Chattopadhyay (1882)",
    englishAbstract: {
      overview:
        "Anandamath is Bankim Chandra Chattopadhyay's historic 1882 political novel set during the Great Bengal Famine of 1770 and the Sannyasi Rebellion.",
      historicalImportance:
        "It gave India its national song 'Vande Mataram', personifying the motherland as the supreme deity. The novel served as the ideological bedrock for early Indian freedom fighters and revolutionaries across the subcontinent.",
      literarySignificance:
        "It pioneered patriotic historical fiction in South Asia, merging spiritual asceticism with armed revolutionary nationalism.",
    },
    historicalContext: {
      titleBn: "ছিয়াত্তরের মন্বন্তর ও সন্ন্যাসী বিদ্রোহের পটভূমি",
      periodBn: "অষ্টাদশ শতক · স্বাধীনতা সংগ্রামের অনুপ্রেরণা (১৮৮২)",
      narrativeBn:
        "১৭৭০ সালের ভয়াবহ ছিয়াত্তরের মন্বন্তর ও সন্ন্যাসী বিদ্রোহের ঐতিহাসিক সত্যের উপর দাঁড়িয়ে রচিত 'আনন্দমঠ'। ব্রিটিশ ইস্ট ইন্ডিয়া কোম্পানির কর আদায়ের নির্মমতার বিরুদ্ধে সত্যানন্দের সন্তান দলের প্রতিরোধই এর কেন্দ্রবিন্দু।",
      keyFactsBn: [
        "'বন্দে মাতরম্' গানের অবিচ্ছেদ্য উৎস",
        "স্বাধীনতা আন্দোলনের সময় একাধিকবার ব্রিটিশ সরকার কর্তৃক নিষিদ্ধ ঘোষিত",
        "মহেন্দ্র, কল্যাণী ও জীবানন্দের আত্মত্যাগের রূপক",
      ],
    },
    characters: [
      {
        nameBn: "সত্যানন্দ",
        nameEn: "Satyananda",
        roleBn: "সন্তান দলের গুরুদেব ও নেতা",
        significanceBn: "দেশমাতৃকার মুক্তির জন্য সর্বত্যাগী সন্ন্যাসী বিপ্লবীদের আদর্শিক পথপ্রদর্শক।",
      },
      {
        nameBn: "ভবানন্দ ও জীবানন্দ",
        nameEn: "Bhabananda & Jibananda",
        roleBn: "বীর সন্ন্যাসী যোদ্ধা",
        significanceBn: "কর্তব্য ও মানবিক প্রেমের টানাপোড়েনে দেশসেবায় আত্মোৎসর্গকারী চরিত্র।",
      },
      {
        nameBn: "শান্তি (নবীনানন্দ)",
        nameEn: "Shanti",
        roleBn: "ছদ্মবেশী নারী সন্ন্যাসী যোদ্ধা",
        significanceBn: "বাংলা উপন্যাসের প্রথম সশস্ত্র স্বাধীনতা সংগ্রামী নারী চরিত্র।",
      },
    ],
    faqs: [
      {
        question: "আনন্দমঠ উপন্যাসের মূল উপজীব্য কী?",
        answer:
          "১৭৭০ সালের ছিয়াত্তরের মন্বন্তর এবং ইস্ট ইন্ডিয়া কোম্পানির বিরুদ্ধে সন্ন্যাসী ও ফকির বিদ্রোহের পটভূমিতে দেশপ্রেম ও মাতৃভূমিকে দেবীরূপে কল্পনা করা।",
      },
      {
        question: "বন্দে মাতরম্ গানের সাথে আনন্দমঠের সম্পর্ক কী?",
        answer:
          "বঙ্কিমচন্দ্র চট্টোপাধ্যায় ১৮৭৫ সালে 'বন্দে মাতরম্' গানটি রচনা করেন এবং ১৮৮২ সালে এটি 'আনন্দমঠ' উপন্যাসের সন্তান দলের মূল মন্ত্র হিসেবে অন্তর্ভুক্ত করেন।",
      },
    ],
    timelineAnchor: "anandamath-1882",
    timelineEraLabelBn: "বঙ্গীয় নবজাগরণ ও মহাকাব্যের যুগ (১৮৫০–১৯০০)",
  },
};
