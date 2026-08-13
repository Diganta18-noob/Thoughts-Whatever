import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

async function exportPrompts() {
  console.log("🔍 Fetching completed prompts from database...\n");

  const prompts = await prisma.promptLog.findMany({
    where: { status: "done" },
    orderBy: { createdAt: "desc" },
  });

  const mdSections = prompts.map((p) => {
    const title = p.summary || p.text.slice(0, 60) + "...";
    const dateStr = p.createdAt.toISOString().split("T")[0];
    const tagsStr = p.tags.length > 0 ? p.tags.join(", ") : "none";
    const linkedStr = p.linkedTo ? ` | **Linked**: ${p.linkedTo}` : "";
    const notesStr = p.notes ? `**Notes**: ${p.notes}\n` : "";

    return `### ${title}
**Source**: ${p.source} | **Category**: ${p.category} | **Date**: ${dateStr}  
**Tags**: ${tagsStr}${linkedStr}

> ${p.text.replace(/\n/g, "\n> ")}

${notesStr}---`;
  });

  const fileContent = `# Prompt History — Thoughts Whatever

> Auto-generated prompt history log for completed feature requests, master prompts, and design specifications.
> **Total Completed Prompts**: ${prompts.length}  
> **Last Exported**: ${new Date().toISOString().split("T")[0]}

---

${mdSections.join("\n\n")}
`;

  const outputPath = path.join(process.cwd(), "PROMPT_HISTORY.md");
  fs.writeFileSync(outputPath, fileContent, "utf8");
  console.log(`\n🎉 Successfully exported ${prompts.length} completed prompts to PROMPT_HISTORY.md!`);
}

exportPrompts()
  .catch((err) => {
    console.error("❌ Failed to export prompts:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
