import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../src/lib/prisma";

// Configure Cloudinary with actual cloud_name from account
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌ Missing Cloudinary env variables!");
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const DRY_RUN = process.argv.includes("--dry-run");
if (DRY_RUN) console.log("🧪 DRY RUN — no database writes\n");

type Uploaded = { url: string; width: number; height: number };

/**
 * `publicId` must be derived from a row's id, never its slug.
 *
 * The slug is Bengali on most rows, and any `replace(/[^a-zA-Z0-9_-]/g, "_")`
 * mapping collapses রক্তকরবী and মেঘনাদবধ alike to a run of underscores — so
 * distinct pieces land on one Cloudinary `public_id`. Paired with
 * `overwrite: true` the second upload replaced the first asset, `verify()` then
 * fetched that URL successfully, and both rows were pointed at whichever image
 * uploaded last: a silent content swap that passed every gate in this script.
 * Two rows are already known to hold an identical cover, so this was live rather
 * than theoretical.
 *
 * `overwrite: false` is the second half of the guard. With id-keyed ids an
 * existing asset means "this row was already uploaded" — Cloudinary returns that
 * asset with `existing: true` instead of replacing it, which is the correct
 * outcome and is logged rather than treated as an error. A dry run uploads for
 * real (it has to, to report the URL it would store), so seeing `existing` on
 * the live run right after a dry run is expected.
 */
async function uploadToCloudinary(input: string, publicId: string): Promise<Uploaded | null> {
  try {
    console.log(`  📤 Uploading to Cloudinary (${publicId})...`);
    const result = await cloudinary.uploader.upload(input, {
      folder: "thoughts-whatever",
      public_id: publicId,
      overwrite: false,
      transformation: [
        { width: 1600, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });
    if ((result as { existing?: boolean }).existing) {
      console.log(`  ↩️  ${publicId} already exists — reusing it, not replacing it`);
    }
    return { url: result.secure_url, width: result.width, height: result.height };
  } catch (err: any) {
    console.error(`  ❌ Failed uploading ${publicId}:`, err?.message || err);
    return null;
  }
}

/** Never overwrite the only copy of an image with a URL that does not resolve. */
async function verify(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    const type = res.headers.get("content-type") ?? "";
    const ok = res.ok && type.startsWith("image/");
    if (!ok) console.error(`  ❌ Verification failed: ${res.status} ${type}`);
    return ok;
  } catch (err: any) {
    console.error(`  ❌ Verification threw:`, err?.message || err);
    return false;
  }
}

async function run() {
  console.log("🚀 Starting Cloudinary Image Migration...\n");

  // 1. Check Cloudinary Ping
  try {
    await cloudinary.api.ping();
    console.log("✅ Cloudinary Connection Verified!\n");
  } catch (err: any) {
    console.error("❌ Cloudinary connection test failed:", err?.message || err);
    process.exit(1);
  }

  // 2. Fetch the rows that still need migrating
  //
  // The `startsWith("data:")` filter is what makes a re-run idempotent: without
  // it this read every row and re-uploaded already-migrated covers, which is how
  // a second run could touch rows it had no business touching. Drafts stay in
  // scope deliberately — an unpublished piece's cover is still a blob in the
  // column, and Task 6 counted them.
  const pieces = await prisma.piece.findMany({
    where: { coverImage: { startsWith: "data:" } },
    select: { id: true, slug: true, titleBn: true, coverImage: true },
  });
  console.log(`Found ${pieces.length} piece(s) with a data-URI cover.`);

  for (const piece of pieces) {
    console.log(`\n📌 Processing Piece: ${piece.slug} (${piece.titleBn})`);

    // The stored data URI is the source, always.
    //
    // This used to prefer a local file under `Content/Thumnail`, matched by
    // heuristics — `dir.includes("Series")`, and `files.find(f => f.includes(d))`
    // where `d` is a bare trailing digit, so "1" also matches "11". A wrong match
    // writes a *different image* over a piece's cover and every gate below still
    // passes, because they check that the new URL serves an image, not that it
    // serves the right one. That directory is also untracked, so the branch only
    // ever fired on one machine. The data URI is the authoritative copy of what
    // the site displays today, which makes migrating it behaviour-preserving.
    // Re-uploading from the higher-resolution originals is a worthwhile but
    // separate pass, and it needs a human-verified slug -> file map: those
    // directory names do not map mechanically onto slugs.
    const sourceInput = piece.coverImage;
    if (!sourceInput) {
      console.log("  ⚠️ No Data URI on this row — skipping.");
      continue;
    }

    const uploaded = await uploadToCloudinary(sourceInput, piece.id);
    if (!uploaded) continue;
    if (!(await verify(uploaded.url))) continue;

    if (DRY_RUN) {
      console.log(`  🧪 would set ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
      continue;
    }

    await prisma.piece.update({
      where: { id: piece.id },
      data: {
        coverImage: uploaded.url,
        coverImageWidth: uploaded.width,
        coverImageHeight: uploaded.height,
      },
    });
    console.log(`  ✨ ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
  }

  // Series covers, same rules — id-keyed public_id, filtered in the query
  const seriesList = await prisma.series.findMany({
    where: { coverImage: { startsWith: "data:" } },
    select: { id: true, slug: true, coverImage: true },
  });
  console.log(`\nFound ${seriesList.length} series with a data-URI cover.`);

  for (const s of seriesList) {
    if (!s.coverImage) continue;
    console.log(`\n📌 Processing Series: ${s.slug}`);
    const uploaded = await uploadToCloudinary(s.coverImage, `series_${s.id}`);
    if (!uploaded) continue;
    if (!(await verify(uploaded.url))) continue;

    if (DRY_RUN) {
      console.log(`  🧪 would set ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
      continue;
    }

    await prisma.series.update({
      where: { id: s.id },
      data: {
        coverImage: uploaded.url,
        coverImageWidth: uploaded.width,
        coverImageHeight: uploaded.height,
      },
    });
    console.log(`  ✨ ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
  }

  console.log("\n🎉 Cloudinary Image Migration Complete!");
}

run()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
