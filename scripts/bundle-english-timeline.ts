import fs from "node:fs";
import { TIMELINE_DATA, TIMELINE_ERAS, TIMELINE_FAQS } from "../src/lib/timeline-data";
import english from "./timeline-english.json";

const file = "locales/content-en.json";
const dictionary: Record<string, string> = JSON.parse(fs.readFileSync(file, "utf8"));
if (TIMELINE_DATA.length !== english.length) throw new Error("Incomplete timeline translations");
TIMELINE_DATA.forEach((item, index) => {
  const [author, significance, context, points] = english[index] as [string, string, string, string[]];
  if (points.length !== item.keyPointsBn.length) throw new Error(`Incomplete key points for ${item.id}`);
  Object.assign(dictionary, {
    [item.titleBn]: item.titleEn!, [item.authorBn]: author,
    [item.significanceBn]: significance, [item.historicalContextBn]: context,
  });
  item.keyPointsBn.forEach((point, i) => { dictionary[point] = points[i]; });
  if (item.twLinkLabelBn) dictionary[item.twLinkLabelBn] = `Explore ${item.titleEn}`;
  const era = TIMELINE_ERAS.find(era => era.id === item.eraId)!;
  const name = dictionary[era.nameBn] || era.nameBn;
  dictionary[item.eraNameBn] = `${name} (${era.range.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6)).replace("বর্তমান", "present")})`;
});
dictionary["গদ্য ও ভাষা"] = "Prose and language";
const faqs = [
  ["How is Bengali literary history divided into periods?", "Bengali literary history is commonly divided into three broad periods: the ancient period (approximately 950/1000–1200, the age of the Charyapada); the medieval period (1200–1800, including Srikrishnakirtan, Mangalkavya, Vaishnava lyrics, and translated literature); and the modern period (from 1800 onward), associated with Fort William College and the Bengal Renaissance. The modern period is further discussed in terms of early prose, the Tagore era, Kallol modernism, postwar writing, and contemporary literature."],
  ["Which was the first Bengali novel?", "Peary Chand Mitra’s Alaler Gharer Dulal (1858), written under the name Tekchand Thakur, is recognized as an early Bengali novella. Bankim Chandra Chattopadhyay’s Durgeshnandini (1865) is generally regarded as the first fully accomplished Bengali novel with the conventions of the Western novel."],
  ["Who introduced blank verse into Bengali literature?", "Michael Madhusudan Datta successfully used blank verse in the play Padmavati (1860) and his epic Meghnadbadh Kavya (1861). It freed the flow of thought from the end rhymes of the traditional fourteen-syllable payar form."],
  ["Why is Chokher Bali called a pioneering psychological novel?", "Published in 1903, Tagore’s Chokher Bali focuses on inner conflict, suppressed desire, jealousy, and self-respect rather than sensational events. Its examination of Binodini and Mahendra’s complicated emotional lives makes it a pioneering psychological novel in Bengali."],
  ["What is the historical significance of Nil Darpan?", "Dinabandhu Mitra’s Nil Darpan (1860) portrays the brutal treatment of Bengal’s peasants by British indigo planters. Closely associated with the Indigo Revolt of 1859–60, it also became the opening production of the National Theatre’s public ticketed performances in 1872."],
  ["Who first won the Nobel Prize for Bengali literature, and when?", "Rabindranath Tagore received the Nobel Prize in Literature in 1913 following the English publication of Gitanjali as Song Offerings. He was the first non-European and first Asian recipient of the literature prize."],
];
TIMELINE_FAQS.forEach((faq, i) => { dictionary[faq.question] = faqs[i][0]; dictionary[faq.answer] = faqs[i][1]; });
fs.writeFileSync(file, JSON.stringify(dictionary, null, 2) + "\n");
console.log(`Bundled ${Object.keys(dictionary).length} English content entries.`);
