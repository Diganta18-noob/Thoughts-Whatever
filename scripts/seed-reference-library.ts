import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Reference Library with rights-aware exhibits...");

  // 1. Check or find Bankim Chandra Author
  let bankimAuthor = await prisma.author.findFirst({
    where: {
      OR: [
        { slug: { contains: "bankim" } },
        { nameBn: { contains: "বঙ্কিম" } },
      ],
    },
  });

  if (!bankimAuthor) {
    bankimAuthor = await prisma.author.create({
      data: {
        slug: "bankimchandra-chattopadhyay",
        nameBn: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
        nameEn: "Bankim Chandra Chattopadhyay",
        era: "১৮৩৮–১৮৯৪",
        bioBn: "বাংলা সাহিত্যের কালজয়ী ঔপন্যাসিক ও আধুনিক বাংলা গদ্যরীতির পথপ্রদর্শক।",
      },
    });
  }

  // Exhibit 1: কালিকাপুরাণ (Public Domain, Hosted PDF + Transcript)
  await prisma.referenceWork.upsert({
    where: { slug: "kalika-puran-panchanan-tarkaratna" },
    create: {
      slug: "kalika-puran-panchanan-tarkaratna",
      titleBn: "কালিকাপুরাণ",
      titleEn: "Kalika Purana",
      subtitleBn: "মূল সংস্কৃত ও বঙ্গানুবাদ সহ পঞ্চানন তর্করত্ন সম্পাদিত প্রাচীন শাস্ত্রীয় সংস্করণ",
      descriptionBn:
        "কালিকাপুরাণ শাক্ত ঐতিহ্যের এক পরম প্রামাণ্য ও দুর্লভ উপপুরাণ। দেবী কামাখ্যা, সতীপীঠ ও তান্ত্রিক দর্শনের গভীর তাত্ত্বিক রূপায়ণে এই গ্রন্থ বাংলা ও কামরূপের ধর্মীয় ও সামাজিক ইতিহাসে অপরিহার্য। ১৩১৬ বঙ্গাব্দে (১৯০৯ খ্রি.) প্রখ্যাত পণ্ডিত পঞ্চানন তর্করত্ন কর্তৃক অনুবাদ ও টীকাসহ বঙ্গবাসী স্টিম প্রেস থেকে এটি মুদ্রিত হয়।",
      type: "BOOK",
      language: "BENGALI",
      era: "১৯০৯ (বিংশ শতাব্দীর সূচনা)",
      subject: "শাক্ত উপপুরাণ ও ধর্মীয় দর্শন",
      tags: ["পুরাণ", "শাক্ত ঐতিহ্য", "কামাখ্যা", "সংস্কৃত সাহিত্য", "পঞ্চানন তর্করত্ন"],
      featured: true,
      published: true,
      editions: {
        create: {
          editionTitleBn: "বঙ্গবাসী স্টিম প্রেস সংস্করণ (১৩০৯ বঙ্গাব্দ)",
          editor: "মহামহোপাধ্যায় পঞ্চানন তর্করত্ন",
          publisher: "বঙ্গবাসী কার্যালয় (শ্রীযুক্ত চারুচন্দ্র বসাক)",
          publicationYear: 1909,
          publicationPlace: "কলকাতা",
          pages: 524,
          notes: "মূল শ্লোকসমূহ দেবনাগরী এবং তদনুযায়ী বাংলা অনুবাদ ও সারার্থ সহ বিস্তারিত প্রকাশনা।",
          coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000",
          hostingMode: "THOUGHTS_WHATEVER",
          sources: {
            create: {
              sourceName: "Internet Archive",
              sourceUrl: "https://archive.org/details/in.ernet.dli.2015.340050",
              externalId: "ark:/13960/t4km8f73b",
              sourceDescription: "Digital Library of India scanned repository copy.",
            },
          },
          rights: {
            create: {
              status: "PUBLIC_DOMAIN",
              license: "Public Domain Mark 1.0",
              licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
              rightsHolder: "Public Domain (Indian Copyright Act 1957, Section 22)",
              attribution: "Digitized via Digital Library of India & National Mission on Manuscripts.",
              verificationNotes:
                "মূল রচয়িতা পৌরাণিক এবং অনুবাদক পঞ্চানন তর্করত্ন ১৯৪০ সালের পূর্বে প্রয়াত হন। ৬০ বছরের পোস্ট-মর্টেম মেয়াদ অতিক্রান্ত হওয়ায় এটি সম্পূর্ণ পাবলিক ডোমেইন।",
              evidenceUrl: "https://archive.org/details/in.ernet.dli.2015.340050",
              verifiedBy: "editorial@thoughtswhatever.com",
              verifiedAt: new Date("2026-09-10"),
            },
          },
          rightsLogs: {
            create: {
              previousStatus: "RIGHTS_UNVERIFIED",
              newStatus: "PUBLIC_DOMAIN",
              changedBy: "editorial@thoughtswhatever.com",
              reason: "Indian Copyright Act Section 22 term expiration verified for 1909 edition",
              evidenceUrl: "https://archive.org/details/in.ernet.dli.2015.340050",
            },
          },
          assets: {
            create: [
              {
                kind: "PDF",
                title: "কালিকাপুরাণ — সম্পূর্ণ মূল সংস্করণ (PDF)",
                fileUrl: "https://archive.org/download/in.ernet.dli.2015.340050/2015.340050.Kalikapurana.pdf",
                mimeType: "application/pdf",
                isDownloadable: true,
                isOnlineReadable: true,
              },
              {
                kind: "TRANSCRIPT",
                title: "প্রথম অধ্যায়: সৃষ্টিপ্রকরণ ও কালিকাতত্ত্ব (অনুলিপি)",
                fileUrl: "https://thoughtswhatever.com/reference/kalika-puran-panchanan-tarkaratna/transcript",
                transcriptText:
                  "ওঁ নারায়ণং নমস্কৃত্য নরঞ্চৈব নরোত্তমম্।\nদেবীং সরস্বতীং ব্যাসং ততো জয়মুদীরয়েৎ॥\n\nঅথ প্রথমোহধ্যায়ঃ —\nযস্মিন্ জাতং জগৎ সর্ব্বং যস্মিন্নেব প্রলীয়তে।\nযেনেদং ধ্রিয়তে নিত্যং তস্মৈ সত্যায় তে নমঃ॥\n\nবঙ্গানুবাদ:\nযাঁহা হইতে এই নিখিল চরাচর বিশ্বের উৎপত্তি, যাঁহাতেই পুনর্বার ইহার মহাপ্রলয়ে লয় ঘটে এবং যাঁহার মহাশক্তিতে এই ব্রহ্মাণ্ড নিত্যকাল বিধৃত রহিয়াছে, সেই পরম সত্য স্বরূপিণী জগন্ময়ী কালিকা দেবীকে প্রণাম করি।",
                isDownloadable: false,
                isOnlineReadable: true,
              },
            ],
          },
        },
      },
    },
    update: {},
  });

  // Exhibit 2: আনন্দমঠ (Bankimchandra, Public Domain)
  await prisma.referenceWork.upsert({
    where: { slug: "anandamath-bangiya-sahitya-parishat" },
    create: {
      slug: "anandamath-bangiya-sahitya-parishat",
      titleBn: "আনন্দমঠ",
      titleEn: "Anandamath",
      subtitleBn: "বঙ্গীয় সাহিত্য পরিষৎ শতবার্ষিক সংস্করণ (ব্রজেন্দ্রনাথ বন্দ্যোপাধ্যায় সম্পাদিত)",
      descriptionBn:
        "১৮৮২ খ্রিস্টাব্দে রচিত বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের অবিস্মরণীয় রাজনৈতিক উপন্যাস ‘আনন্দমঠ’। এই উপন্যাসেই প্রথম ধ্বনিত হয়েছিল অমর জাতীয় সঙ্গীত ‘বন্দে মাতরম্’। বঙ্গীয় সাহিত্য পরিষৎ কর্তৃক ব্রজেন্দ্রনাথ বন্দ্যোপাধ্যায় ও সজনীকান্ত দাসের সম্পাদনায় নিখুঁত মূল পাঠ সংবলিত শতবার্ষিক সংস্করণ এটি।",
      type: "BOOK",
      language: "BENGALI",
      era: "১৮৮২ (ঊনবিংশ শতাব্দী)",
      subject: "ঐতিহাসিক ও রাজনৈতিক উপন্যাস",
      tags: ["বঙ্কিমচন্দ্র", "বন্দে মাতরম", "আনন্দমঠ", "ঐতিহাসিক উপন্যাস"],
      featured: true,
      published: true,
      authorId: bankimAuthor.id,
      editions: {
        create: {
          editionTitleBn: "বঙ্গীয় সাহিত্য পরিষৎ শতবার্ষিক সংস্করণ (১৯৩৮)",
          editor: "ব্রজেন্দ্রনাথ বন্দ্যোপাধ্যায় ও সজনীকান্ত দাস",
          publisher: "বঙ্গীয় সাহিত্য পরিষৎ",
          publicationYear: 1938,
          publicationPlace: "কলকাতা",
          pages: 184,
          notes: "বঙ্কিম শতবার্ষিক জন্মজয়ন্তী স্মারক গ্রন্থমালা (প্রথম খণ্ড)।",
          coverImage: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1000",
          hostingMode: "THOUGHTS_WHATEVER",
          sources: {
            create: {
              sourceName: "Internet Archive",
              sourceUrl: "https://archive.org/details/dli.bengali.10689.4795",
              sourceDescription: "Bangiya Sahitya Parishad Preservation Series.",
            },
          },
          rights: {
            create: {
              status: "PUBLIC_DOMAIN",
              license: "Public Domain Mark 1.0",
              rightsHolder: "Public Domain",
              verificationNotes:
                "বঙ্কিমচন্দ্র চট্টোপাধ্যায় ১৮৯৪ সালে প্রয়াত হন। রচনার মূল অধিকার সর্বসাধারণের জন্য উন্মুক্ত।",
              evidenceUrl: "https://archive.org/details/dli.bengali.10689.4795",
              verifiedBy: "editorial@thoughtswhatever.com",
              verifiedAt: new Date("2026-09-11"),
            },
          },
          assets: {
            create: [
              {
                kind: "PDF",
                title: "আনন্দমঠ — শতবার্ষিক সংস্করণ (PDF)",
                fileUrl: "https://archive.org/download/dli.bengali.10689.4795/10689.4795.anandamath.pdf",
                mimeType: "application/pdf",
                isDownloadable: true,
                isOnlineReadable: true,
              },
            ],
          },
        },
      },
    },
    update: {},
  });

  // Exhibit 3: নীলদর্পণ (Dinabandhu Mitra, Public Domain Document)
  await prisma.referenceWork.upsert({
    where: { slug: "nil-darpan-1860-edition" },
    create: {
      slug: "nil-darpan-1860-edition",
      titleBn: "নীলদর্পণ নাটক",
      titleEn: "Nil Darpan (The Indigo Mirror)",
      subtitleBn: "নীলকর বিষধর দংশন কাতর প্রজানিকর ক্ষেমঙ্করেণ কেনচিৎ পথিকেনে প্রণীতম্",
      descriptionBn:
        "১৮৬০ সালে ঢাকা থেকে প্রকাশিত দীনবন্ধু মিত্রের ঐতিহাসিক নাটক ‘নীলদর্পণ’। নীলকর সাহেবদের অকথ্য অত্যাচার এবং বাংলার কৃষক সমাজের বিদ্রোহের এক অবিসংবাদিত দলিল। যার ইংরেজি অনুবাদ প্রকাশ করার দায়ে রেভারেন্ড জেমস লং-এর কারাদণ্ড হয়েছিল।",
      type: "DOCUMENT",
      language: "BENGALI",
      era: "১৮৬০ (নীল বিদ্রোহ কাল)",
      subject: "নাটক ও ঐতিহাসিক সামাজিক দলিল",
      tags: ["দীনবন্ধু মিত্র", "নীল বিদ্রোহ", "বাংলা নাটক", "ঐতিহাসিক নথি"],
      featured: true,
      published: true,
      editions: {
        create: {
          editionTitleBn: "প্রথম ঢাকা সংস্করণ (১৮৬০)",
          publisher: "সি. এইচ. ম্যানুয়েল প্রেস / ঢাকা",
          publicationYear: 1860,
          publicationPlace: "ঢাকা",
          pages: 112,
          notes: "নাটকের প্রথম সংস্করণ, ছদ্মনামে প্রকাশিত।",
          coverImage: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1000",
          hostingMode: "THOUGHTS_WHATEVER",
          sources: {
            create: {
              sourceName: "National Library of India",
              sourceUrl: "https://archive.org/details/nildarpan1860",
              sourceDescription: "Preserved in the Rare Book Section of the National Library.",
            },
          },
          rights: {
            create: {
              status: "PUBLIC_DOMAIN",
              license: "Public Domain Mark 1.0",
              rightsHolder: "Public Domain",
              verificationNotes: "দীনবন্ধু মিত্র ১৮৭৩ সালে প্রয়াত হন। সম্পূর্ণ পাবলিক ডোমেইন।",
              evidenceUrl: "https://archive.org/details/nildarpan1860",
              verifiedBy: "editorial@thoughtswhatever.com",
              verifiedAt: new Date("2026-09-11"),
            },
          },
          assets: {
            create: [
              {
                kind: "PDF",
                title: "নীলদর্পণ নাটক — ১৮৬০ প্রথম সংস্করণ (PDF)",
                fileUrl: "https://archive.org/download/nildarpan1860/nildarpan.pdf",
                mimeType: "application/pdf",
                isDownloadable: true,
                isOnlineReadable: true,
              },
            ],
          },
        },
      },
    },
    update: {},
  });

  // Exhibit 4: কলিকাতা বিশ্ববিদ্যালয়ের পুথিশালা তালিকা (External Source Only)
  await prisma.referenceWork.upsert({
    where: { slug: "calcutta-university-manuscripts-catalog" },
    create: {
      slug: "calcutta-university-manuscripts-catalog",
      titleBn: "কলিকাতা বিশ্ববিদ্যালয় প্রাচীন বাংলা পুথিশালা তালিকা",
      titleEn: "Descriptive Catalogue of Bengali Manuscripts in Calcutta University",
      subtitleBn: "প্রথম খণ্ড — বৈষ্ণব পদাবলী, মঙ্গলকাব্য ও অনুবাদ সাহিত্য",
      descriptionBn:
        "কলিকাতা বিশ্ববিদ্যালয়ের বাংলা ভাষা ও সাহিত্য বিভাগ কর্তৃক সংগৃহীত প্রাচীন ও মধ্যযুগীয় বাংলা পুথিসমূহের বিশদ বিবরণমূলক ঐতিহাসিক ক্যাটালগ।",
      type: "ARCHIVE",
      language: "BENGALI",
      era: "১৯২৬",
      subject: "পুথিশালা ক্যাটালগ ও সংগ্রহ তালিকা",
      tags: ["পুথি", "কলিকাতা বিশ্ববিদ্যালয়", "মধ্যযুগ", "সংগ্রহশালা"],
      featured: false,
      published: true,
      editions: {
        create: {
          editionTitleBn: "কলিকাতা বিশ্ববিদ্যালয় প্রেস সংকলন (১৯২৬)",
          publisher: "কলিকাতা বিশ্ববিদ্যালয়",
          publicationYear: 1926,
          publicationPlace: "কলকাতা",
          pages: 412,
          coverImage: "https://images.unsplash.com/photo-1507842229451-9f232615ce32?q=80&w=1000",
          hostingMode: "EXTERNAL",
          sources: {
            create: {
              sourceName: "University of Calcutta Archives",
              sourceUrl: "https://archive.org/details/cu-manuscripts-catalog-1926",
              sourceDescription: "Archived institutionally at Calcutta University Central Library.",
            },
          },
          rights: {
            create: {
              status: "EXTERNAL_SOURCE",
              rightsHolder: "University of Calcutta",
              verificationNotes:
                "প্রাতিষ্ঠানিক ক্যাটালগ। সরাসরি ফাইল হোস্ট না করে মূল সংগ্রহাগারের রেফারেন্স লিংক প্রদান করা হয়েছে।",
              evidenceUrl: "https://archive.org/details/cu-manuscripts-catalog-1926",
              verifiedBy: "editorial@thoughtswhatever.com",
              verifiedAt: new Date("2026-09-12"),
            },
          },
        },
      },
    },
    update: {},
  });

  // Exhibit 5: আধুনিক বাংলা ব্যাকরণ পাঠ (Rights Unverified - Download Strictly Disabled!)
  await prisma.referenceWork.upsert({
    where: { slug: "adhunik-bangla-byakaran-unverified-exhibit" },
    create: {
      slug: "adhunik-bangla-byakaran-unverified-exhibit",
      titleBn: "আধুনিক বাংলা ভাষার গঠন ও রূপতত্ত্ব",
      titleEn: "Structure and Morphology of Modern Bengali",
      subtitleBn: "গবেষকদের তথ্যসূত্রের জন্য তালিকাভুক্ত প্রাথমিক এন্ট্রি",
      descriptionBn:
        "আধুনিক বাংলা ব্যাকরণ ও বাক্যতত্ত্ব সংক্রান্ত একটি তাত্ত্বিক সংকলন। ইন্টারনেট আর্কাইভে সংরক্ষিত থাকলেও এর সুনির্দিষ্ট সংস্করণ ও প্রকাশকের স্বত্ব পর্যালোচনা প্রক্রিয়াধীন রয়েছে।",
      type: "BOOK",
      language: "BENGALI",
      era: "১৯৭৫",
      subject: "ভাষাতত্ত্ব ও ব্যাকরণ",
      tags: ["ভাষাতত্ত্ব", "ব্যাকরণ", "অমীমাংসিত স্বত্ব"],
      featured: false,
      published: true,
      editions: {
        create: {
          editionTitleBn: "প্রমিত শিক্ষাক্রম সংস্করণ",
          publisher: "বিদ্যাভারতী প্রকাশন",
          publicationYear: 1975,
          pages: 310,
          hostingMode: "EXTERNAL",
          sources: {
            create: {
              sourceName: "Internet Archive",
              sourceUrl: "https://archive.org/details/sample-bengali-grammar-1975",
              sourceDescription: "Community upload on Internet Archive.",
            },
          },
          rights: {
            create: {
              status: "RIGHTS_UNVERIFIED",
              verificationNotes:
                "ইন্টারনেট আর্কাইভে লভ্য হলেও প্রকাশকের বা উত্তরাধিকারীর কপিরাইট মেয়াদ নিশ্চিত নয়। Thoughts.Whatever এর নীতি অনুসারে কোনো ফাইল হোস্ট বা ডাউনলোড করা নিষিদ্ধ।",
              evidenceUrl: "https://archive.org/details/sample-bengali-grammar-1975",
            },
          },
        },
      },
    },
    update: {},
  });

  console.log("✅ Reference Library seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
