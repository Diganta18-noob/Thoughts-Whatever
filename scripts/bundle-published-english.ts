import "dotenv/config";
import fs from "node:fs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const file = "locales/content-en.json";
  const dictionary: Record<string, string> = JSON.parse(fs.readFileSync(file, "utf8"));
  const [pieces, authors, series, references] = await Promise.all([
    prisma.piece.findMany({ where: { status: "PUBLISHED" }, select: { titleBn: true, titleEn: true } }),
    prisma.author.findMany({ where: { pieces: { some: { status: "PUBLISHED" } } }, select: { nameBn: true, nameEn: true } }),
    prisma.series.findMany({ where: { pieces: { some: { status: "PUBLISHED" } } }, select: { titleBn: true, titleEn: true } }),
    prisma.referenceWork.findMany({ where: { published: true }, select: { titleBn: true, titleEn: true, descriptionBn: true, descriptionEn: true, author: { select: { nameBn: true, nameEn: true } } } }),
  ]);
  const add = (source: string | null, translation: string | null | undefined) => {
    if (source && translation && !/[\u0980-\u09ff]/.test(translation)) dictionary[source.replace(/\s+/g, " ").trim()] = translation;
  };
  [...pieces, ...series, ...references].forEach(item => {
    add(item.titleBn, item.titleEn);
    if (item.titleEn) add(`${item.titleBn} — Thoughts Whatever`, `${item.titleEn} — Thoughts Whatever`);
  });
  authors.forEach(author => add(author.nameBn, author.nameEn));
  references.forEach(item => {
    add(item.descriptionBn, item.descriptionEn);
    if (item.author) add(item.author.nameBn, item.author.nameEn);
    if (item.titleEn) add(`${item.titleBn} (${item.titleEn}) | Reference Library — Thoughts Whatever`, `${item.titleEn} | Reference Library — Thoughts Whatever`);
  });
  fs.writeFileSync(file, JSON.stringify(dictionary, null, 2) + "\n");
  console.log(`Bundled ${Object.keys(dictionary).length} English entries from public source fields.`);
}
main().catch(error => { console.error(error.name); process.exitCode = 1; }).finally(() => prisma.$disconnect());
