import { prisma } from "../src/lib/prisma";

async function seedPrompts() {
  console.log("🌱 Seeding initial prompts into MongoDB Atlas...\n");

  const initialPrompts = [
    {
      text: "make a master prompt for making a proper professional audit log in admin portal",
      summary: "System Audit Log Architecture",
      source: "kiro",
      category: "feature",
      status: "done",
      tags: ["audit-log", "admin", "security", "mongodb"],
      linkedTo: "audit-log",
      notes: "Implemented with Prisma model AuditLog, timeline UI, search filters, and CSV export.",
    },
    {
      text: "make a master plan for premium editorial image layout system",
      summary: "Premium Editorial Image Layout System",
      source: "kiro",
      category: "design",
      status: "done",
      tags: ["image-layout", "portrait", "editorial", "cards"],
      linkedTo: "editorial-hero",
      notes: "Implemented responsive editorial image layout with base64/WebP optimization.",
    },
    {
      text: "store the content data so that in future if anything happen, i can retrieve data",
      summary: "Content & Database Backup System",
      source: "kiro",
      category: "feature",
      status: "done",
      tags: ["backup", "database", "recovery", "automation"],
      linkedTo: "system-backup",
      notes: "Built automated backup orchestrator and one-click JSON/zip export.",
    },
    {
      text: "implement Comet hover zoom effect in this project",
      summary: "Comet Hover Zoom Effect",
      source: "antigravity",
      category: "design",
      status: "idea",
      tags: ["hover", "animation", "cards", "ui"],
      notes: "Planned subtle image zoom and soft drop shadow on piece cards.",
    },
    {
      text: "Universal Prompt Storage System — store, search, and retrieve all prompts given across tools like Kiro, Antigravity, or manual entry",
      summary: "Universal Prompt Storage System",
      source: "kiro",
      category: "feature",
      status: "done",
      tags: ["prompt-log", "admin", "ai-tools", "library"],
      linkedTo: "prompts-dashboard",
      notes: "Built PromptLog schema, dual-auth API, library UI, quick-add modal, and Markdown export script.",
    },
  ];

  for (const p of initialPrompts) {
    const created = await prisma.promptLog.create({
      data: p,
    });
    console.log(`✅ Stored prompt: "${created.summary}" (${created.status})`);
  }

  console.log("\n🎉 Prompts successfully seeded!");
}

seedPrompts()
  .catch((err) => {
    console.error("❌ Failed to seed prompts:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
