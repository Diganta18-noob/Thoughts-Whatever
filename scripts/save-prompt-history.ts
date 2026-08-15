import fs from "fs";
import path from "path";
import os from "os";
import { prisma } from "../src/lib/prisma";

interface ExtractedPrompt {
  id?: string;
  conversationId: string;
  timestamp: Date;
  rawText: string;
  cleanText: string;
  category: "feature" | "design" | "bug" | "plan" | "question" | "other";
  summary: string;
}

function categorizePrompt(text: string): { category: ExtractedPrompt["category"]; summary: string } {
  const lower = text.toLowerCase();
  
  if (lower.includes("error") || lower.includes("fatal") || lower.includes("fail") || lower.includes("fix") || lower.includes("bug") || lower.includes("stuck") || lower.includes("crashed")) {
    return {
      category: "bug",
      summary: text.slice(0, 80).replace(/[\r\n]+/g, " ").trim(),
    };
  }
  if (lower.includes("plan") || lower.includes("architecture") || lower.includes("audit") || lower.includes("root cause")) {
    return {
      category: "plan",
      summary: text.slice(0, 80).replace(/[\r\n]+/g, " ").trim(),
    };
  }
  if (lower.includes("design") || lower.includes("style") || lower.includes("layout") || lower.includes("hero") || lower.includes("color") || lower.includes("theme") || lower.includes("ui") || lower.includes("screenshot")) {
    return {
      category: "design",
      summary: text.slice(0, 80).replace(/[\r\n]+/g, " ").trim(),
    };
  }
  if (lower.includes("feat") || lower.includes("implement") || lower.includes("add") || lower.includes("create") || lower.includes("backup") || lower.includes("migrate") || lower.includes("toast")) {
    return {
      category: "feature",
      summary: text.slice(0, 80).replace(/[\r\n]+/g, " ").trim(),
    };
  }
  if (lower.includes("why") || lower.includes("how") || lower.includes("is it") || lower.includes("check") || lower.includes("tell me")) {
    return {
      category: "question",
      summary: text.slice(0, 80).replace(/[\r\n]+/g, " ").trim(),
    };
  }

  return {
    category: "other",
    summary: text.slice(0, 80).replace(/[\r\n]+/g, " ").trim(),
  };
}

export async function autoSavePrompts(): Promise<{ scanned: number; newSaved: number }> {
  console.log("🔄 Starting Auto Prompt Saver...\n");

  const possibleBrainDirs = [
    path.join(os.homedir(), ".gemini", "antigravity-ide", "brain"),
    path.join(process.env.APPDATA || "", "antigravity-ide", "brain"),
  ];

  let brainDir = possibleBrainDirs.find((p) => fs.existsSync(p));
  if (!brainDir) {
    console.warn("⚠️ Brain directory not found in default paths. Checking fallback...");
    brainDir = path.join(os.homedir(), ".gemini", "antigravity-ide", "brain");
  }

  if (!fs.existsSync(brainDir)) {
    console.log("No brain directory found. Exiting prompt saver.");
    return { scanned: 0, newSaved: 0 };
  }

  console.log(`📂 Brain Directory: ${brainDir}`);

  const conversationFolders = fs.readdirSync(brainDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const extracted: ExtractedPrompt[] = [];

  for (const convId of conversationFolders) {
    const transcriptPath = path.join(brainDir, convId, ".system_generated", "logs", "transcript.jsonl");
    if (!fs.existsSync(transcriptPath)) continue;

    try {
      const content = fs.readFileSync(transcriptPath, "utf8");
      const lines = content.split("\n").filter((l) => l.trim().length > 0);

      for (const line of lines) {
        try {
          const step = JSON.parse(line);
          if (step.type === "USER_INPUT" && step.content) {
            let text = String(step.content);

            // Strip metadata tags
            text = text.replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, "");
            text = text.replace(/<USER_SETTINGS_CHANGE>[\s\S]*?<\/USER_SETTINGS_CHANGE>/g, "");
            text = text.replace(/<USER_REQUEST>/g, "").replace(/<\/USER_REQUEST>/g, "");
            text = text.trim();

            if (text.length > 0) {
              const { category, summary } = categorizePrompt(text);
              extracted.push({
                conversationId: convId,
                timestamp: new Date(step.timestamp || Date.now()),
                rawText: step.content,
                cleanText: text,
                category,
                summary,
              });
            }
          }
        } catch {
          // Ignore json parse line error
        }
      }
    } catch (err) {
      console.warn(`Could not read transcript for ${convId}:`, err);
    }
  }

  console.log(`📋 Total Prompts Extracted across sessions: ${extracted.length}`);

  let newSavedCount = 0;

  // Sync to database if DATABASE_URL is available
  try {
    for (const item of extracted) {
      // Check if prompt already exists by text match
      const existing = await prisma.promptLog.findFirst({
        where: {
          text: item.cleanText,
        },
      });

      if (!existing) {
        await prisma.promptLog.create({
          data: {
            text: item.cleanText,
            summary: item.summary,
            source: "antigravity",
            category: item.category,
            status: "done",
            tags: ["auto-saved", item.category, item.conversationId.slice(0, 8)],
            notes: `Auto-saved from conversation ${item.conversationId} on ${item.timestamp.toISOString()}`,
          },
        });
        newSavedCount++;
      }
    }
    console.log(`💾 Saved ${newSavedCount} new prompts into database PromptLog.`);
  } catch (dbErr) {
    console.warn("⚠️ Database sync skipped or partial:", (dbErr as Error).message);
  }

  return { scanned: extracted.length, newSaved: newSavedCount };
}

// Run directly if invoked via CLI
if (require.main === module) {
  autoSavePrompts()
    .then((res) => {
      console.log(`\n✨ Auto Prompt Saver completed! (Scanned: ${res.scanned}, Newly Stored: ${res.newSaved})`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Auto Prompt Saver encountered an error:", err);
      process.exit(1);
    });
}
