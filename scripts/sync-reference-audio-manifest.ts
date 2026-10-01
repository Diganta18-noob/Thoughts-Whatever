import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";
import type { AudioManifest } from "../src/lib/reference/audio/types";

const prisma = new PrismaClient();
const slug = "debabrata-biswas-rabindrasangeet-1974";
const manifest = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src/data/reference/audio/debabrata-biswas-manifest.json"), "utf8"),
) as AudioManifest;

async function main() {
  const work = await prisma.referenceWork.findUnique({
    where: { slug },
    select: { editions: { select: { assets: { where: { kind: "AUDIO" }, select: { id: true, fileUrl: true, audioManifest: true } } } } },
  });
  const assets = work?.editions.flatMap((edition) => edition.assets) ?? [];
  if (assets.length !== 1 || !assets[0].fileUrl?.endsWith("/recording-1974-audio.m4a")) {
    throw new Error("Expected exactly one matching archival audio asset");
  }
  const previous = assets[0].audioManifest as unknown as AudioManifest | null;
  if (!previous || previous.cues.length !== manifest.cues.length ||
      previous.cues.some((cue, index) => cue.text !== manifest.cues[index].text)) {
    throw new Error("Transcript differs from published audio manifest; refusing update");
  }
  if (process.argv.includes("--apply")) {
    await prisma.referenceAsset.update({ where: { id: assets[0].id }, data: { audioManifest: manifest as unknown as Prisma.InputJsonValue } });
    console.log(`Updated ${manifest.cues.length} caption cues for ${slug}`);
  } else {
    console.log(`Ready to update ${manifest.cues.length} caption cues for ${slug}; pass --apply to write`);
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
