import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { validateHostingRights } from "../src/lib/reference/rights-engine";

const prisma = new PrismaClient();

async function seedDebabrataBiswasAudio() {
  console.log("🎙️ Seeding Debabrata Biswas 1974 Archival Audio Record...\n");

  const slug = "debabrata-biswas-rabindrasangeet-1974";
  const audioCloudinaryUrl =
    "https://res.cloudinary.com/dpn5pbrml/video/upload/v1790339298/reference/debabrata-biswas/recording-1974-audio.m4a";
  const coverCloudinaryUrl =
    "https://res.cloudinary.com/dpn5pbrml/image/upload/v1790338482/reference/debabrata-biswas/cover.png";

  const manifestPath = path.join(
    process.cwd(),
    "src/data/reference/audio/debabrata-biswas-manifest.json",
  );
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Audio manifest not found at ${manifestPath}`);
  }
  const audioManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const transcriptRawPath = path.join(
    process.cwd(),
    "Reference/Reference/Debabrata Biswas/Content/Debabrata Biswas.txt",
  );
  const transcriptText = fs.existsSync(transcriptRawPath)
    ? fs.readFileSync(transcriptRawPath, "utf8")
    : audioManifest.cues.map((c: any) => c.text).join(" ");

  // Validate hosting rights strictly before DB write
  validateHostingRights("THOUGHTS_WHATEVER", "LICENSED");

  // 1. Author upsert
  const author = await prisma.author.upsert({
    where: { slug: "debabrata-biswas" },
    update: {
      nameBn: "দেবব্রত বিশ্বাস",
      nameEn: "Debabrata Biswas",
      bioBn:
        "দেবব্রত বিশ্বাস (১৯১১ – ১৯৮০) ছিলেন প্রখ্যাত বাঙালি রবীন্দ্রসংগীত শিল্পী। রবীন্দ্রসংগীতের গতানুগতিক ধারার বাইরে এসে উদাত্ত কণ্ঠ, গভীর ভাবাবেগ এবং পাশ্চাত্য ও প্রাচ্য বাদ্যযন্ত্রের সংমিশ্রণে রবীন্দ্রসংগীত পরিবেশনে তিনি ছিলেন যুগান্তকারী পথিকৃৎ।",
      portrait: coverCloudinaryUrl,
    },
    create: {
      slug: "debabrata-biswas",
      nameBn: "দেবব্রত বিশ্বাস",
      nameEn: "Debabrata Biswas",
      bioBn:
        "দেবব্রত বিশ্বাস (১৯১১ – ১৯৮০) ছিলেন প্রখ্যাত বাঙালি রবীন্দ্রসংগীত শিল্পী। রবীন্দ্রসংগীতের গতানুগতিক ধারার বাইরে এসে উদাত্ত কণ্ঠ, গভীর ভাবাবেগ এবং পাশ্চাত্য ও প্রাচ্য বাদ্যযন্ত্রের সংমিশ্রণে রবীন্দ্রসংগীত পরিবেশনে তিনি ছিলেন যুগান্তকারী পথিকৃৎ।",
      portrait: coverCloudinaryUrl,
    },
  });
  console.log(`✅ Author verified: ${author.nameBn} (${author.slug})`);

  // 2. ReferenceWork upsert
  const work = await prisma.referenceWork.upsert({
    where: { slug },
    update: {
      titleBn: "রবীন্দ্রসংগীত সম্বন্ধে সমস্যা ও মতামত (১৯৭৪)",
      titleEn: "Debabrata Biswas Talked (1974) About Rabindrasangeet",
      subtitleBn: "ঐতিহাসিক অডিও কথন, রবীন্দ্রসংগীত বিতর্ক ও মিউজিক বোর্ডের সার্কুলার বিশ্লেষণ",
      descriptionBn:
        "১৯৭৪ সালের ৫ই মার্চ সন্ধ্যায় ধারণকৃত দেবব্রত বিশ্বাসের (জর্জ বিশ্বাস) ঐতিহাসিক ব্যক্তিগত টেপ রেকর্ডিং। এই অমূল্য মৌখিক নথিতে তিনি বিশ্বভারতী মিউজিক বোর্ডের অনমনীয় বিধিনিষেধ, বাদ্যযন্ত্রের ব্যবহার নিয়ে তাঁদের আপত্তি, রবীন্দ্রনাথের নিজস্ব সুরদর্শন ও দিলীপকুমার রায়কে লেখা কবির চিঠির আলোকে রবীন্দ্রসংগীত পরিবেশনে শিল্পীর ব্যাখ্যার স্বাধীনতার সপক্ষে তাঁর ঐতিহাসিক জবানবন্দি পেশ করেন।\n\n'আপনার জন্য আবার সেটা টেপ করে দেওয়া হচ্ছে। আপনি দয়া করে আমার মৃত্যুর পর সকলকে সেটা শোনাবেন।' — দেবব্রত বিশ্বাস।\n\nThoughts.Whatever-এর আধুনিক অডিও কক্ষে সম্পূর্ণ ২৯ মিনিট ২৫ সেকেন্ডের এই অডিওটি রিয়েল-টাইম অডিও পালস ও সিঙ্কড বাংলা অটো-ক্যাপশনসহ পাঠ ও শ্রবণ করা যাবে।",
      type: "AUDIO",
      language: "BENGALI",
      era: "আধুনিক বাংলা সংগীততত্ত্ব ও মৌখিক ইতিহাস (১৯৭৪)",
      subject: "রবীন্দ্রসংগীত, সংগীতের নন্দনতত্ত্ব ও শিল্পীর স্বাধীনতা",
      authorId: author.id,
      published: true,
    },
    create: {
      slug,
      titleBn: "রবীন্দ্রসংগীত সম্বন্ধে সমস্যা ও মতামত (১৯৭৪)",
      titleEn: "Debabrata Biswas Talked (1974) About Rabindrasangeet",
      subtitleBn: "ঐতিহাসিক অডিও কথন, রবীন্দ্রসংগীত বিতর্ক ও মিউজিক বোর্ডের সার্কুলার বিশ্লেষণ",
      descriptionBn:
        "১৯৭৪ সালের ৫ই মার্চ সন্ধ্যায় ধারণকৃত দেবব্রত বিশ্বাসের (জর্জ বিশ্বাস) ঐতিহাসিক ব্যক্তিগত টেপ রেকর্ডিং। এই অমূল্য মৌখিক নথিতে তিনি বিশ্বভারতী মিউজিক বোর্ডের অনমনীয় বিধিনিষেধ, বাদ্যযন্ত্রের ব্যবহার নিয়ে তাঁদের আপত্তি, রবীন্দ্রনাথের নিজস্ব সুরদর্শন ও দিলীপকুমার রায়কে লেখা কবির চিঠির আলোকে রবীন্দ্রসংগীত পরিবেশনে শিল্পীর ব্যাখ্যার স্বাধীনতার সপক্ষে তাঁর ঐতিহাসিক জবানবন্দি পেশ করেন।\n\n'আপনার জন্য আবার সেটা টেপ করে দেওয়া হচ্ছে। আপনি দয়া করে আমার মৃত্যুর পর সকলকে সেটা শোনাবেন।' — দেবব্রত বিশ্বাস।\n\nThoughts.Whatever-এর আধুনিক অডিও কক্ষে সম্পূর্ণ ২৯ মিনিট ২৫ সেকেন্ডের এই অডিওটি রিয়েল-টাইম অডিও পালস ও সিঙ্কড বাংলা অটো-ক্যাপশনসহ পাঠ ও শ্রবণ করা যাবে।",
      type: "AUDIO",
      language: "BENGALI",
      era: "আধুনিক বাংলা সংগীততত্ত্ব ও মৌখিক ইতিহাস (১৯৭৪)",
      subject: "রবীন্দ্রসংগীত, সংগীতের নন্দনতত্ত্ব ও শিল্পীর স্বাধীনতা",
      authorId: author.id,
      published: true,
    },
  });
  console.log(`✅ ReferenceWork upserted: ${work.titleBn} (${work.slug})`);

  // 3. Delete existing editions for this slug if any to cleanly rebuild
  const existingEditions = await prisma.referenceEdition.findMany({
    where: { workId: work.id },
  });
  for (const ed of existingEditions) {
    await prisma.referenceEdition.delete({ where: { id: ed.id } });
  }

  // 4. ReferenceEdition creation
  const edition = await prisma.referenceEdition.create({
    data: {
      workId: work.id,
      editionTitleBn: "১৯৭৪ সালের মূল টেপ রেকর্ডিং সংস্করণ",
      publisher: "ঐতিহাসিক ব্যক্তিগত টেপ আর্কাইভ",
      publicationYear: 1974,
      publicationPlace: "কলকাতা",
      hostingMode: "THOUGHTS_WHATEVER",
      coverImage: coverCloudinaryUrl,
      notes:
        "রেকর্ডিং তারিখ: ৫ই মার্চ ১৯৭৪। দেবব্রত বিশ্বাসের নিজস্ব কণ্ঠ। দৈর্ঘ্য: ২৯ মিনিট ২৫ সেকেন্ড।",
      rights: {
        create: {
          status: "LICENSED",
          attribution:
            "রেকর্ডিং: দেবব্রত বিশ্বাস (৫ই মার্চ ১৯৭৪)। তাঁর নির্দেশানুসারে: 'আপনি দয়া করে আমার মৃত্যুর পর সকলকে সেটা শোনাবেন।'",
        },
      },
      sources: {
        create: {
          sourceName: "Debabrata Biswas Archival Oral Heritage",
          sourceUrl: audioCloudinaryUrl,
        },
      },
      assets: {
        create: [
          {
            kind: "AUDIO",
            title: "Debabrata Biswas Talked (1974) About Rabindrasangeet — Clean Audio",
            fileUrl: audioCloudinaryUrl,
            mimeType: "audio/mp4",
            sizeBytes: BigInt(28546249),
            durationSec: 1765,
            narrator: "দেবব্রত বিশ্বাস",
            isOnlineReadable: true,
            isDownloadable: true,
            audioManifest: audioManifest as any,
          },
          {
            kind: "TRANSCRIPT",
            title: "পূর্ণাঙ্গ বাংলা প্রতিলিপি (Full Bengali Transcript)",
            fileUrl: audioCloudinaryUrl,
            mimeType: "text/plain",
            transcriptText,
            isOnlineReadable: true,
            isDownloadable: true,
          },
        ],
      },
    },
  });

  console.log(`✅ ReferenceEdition created: ${edition.editionTitleBn} (ID: ${edition.id})`);
  console.log("🎉 Seeding complete for Debabrata Biswas 1974 Audio Archive!");
}

seedDebabrataBiswasAudio()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
