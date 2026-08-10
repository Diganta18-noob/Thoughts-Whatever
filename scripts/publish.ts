import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { loadManifest, saveManifest, hasFileChanged, updateFileHash } from "./content-manifest";
import { processContent } from "./process-content";
import { generateDocs } from "./generate-series-docs";

async function runMasterPipeline() {
  const args = process.argv.slice(2);
  const isForce = args.includes("--force");
  const isDryRun = args.includes("--dry-run");
  const isNoGit = args.includes("--no-git");
  const isSkipDocs = args.includes("--skip-docs");

  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║  🚀 Thoughts Whatever — Unified Content Automation Engine     ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  const manifest = loadManifest();
  const contextDir = path.join(process.cwd(), "Content", "context");
  const soloDir = path.join(process.cwd(), "Content", "solo");
  const thumbnailDir = path.join(process.cwd(), "Content", "Thumnail");

  let newOrChangedCount = 0;
  const filesToTrack: string[] = [];

  // Check Series Content
  if (fs.existsSync(contextDir)) {
    const seriesFolders = fs.readdirSync(contextDir, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const folder of seriesFolders) {
      const folderPath = path.join(contextDir, folder.name);
      const files = fs.readdirSync(folderPath).filter((f) => (f.endsWith(".txt") || f.endsWith(".md")) && !f.endsWith(".social.md"));
      for (const f of files) {
        const fullPath = path.join(folderPath, f);
        filesToTrack.push(fullPath);
        if (isForce || hasFileChanged(fullPath, manifest)) {
          newOrChangedCount++;
        }
      }
    }
  }

  // Check Solo Content
  if (fs.existsSync(soloDir)) {
    const files = fs.readdirSync(soloDir).filter((f) => (f.endsWith(".txt") || f.endsWith(".md")) && !f.endsWith(".social.md"));
    for (const f of files) {
      const fullPath = path.join(soloDir, f);
      filesToTrack.push(fullPath);
      if (isForce || hasFileChanged(fullPath, manifest)) {
        newOrChangedCount++;
      }
    }
  }

  console.log(`📊 Scan Results:`);
  console.log(`   - Total Content Files Tracked: ${filesToTrack.length}`);
  console.log(`   - New or Modified Content Files: ${newOrChangedCount}`);

  if (newOrChangedCount === 0 && !isForce) {
    console.log("\n✨ All content is up-to-date! Nothing new to process.");
    console.log("   (Use `npm run publish -- --force` to force re-processing)");
    process.exit(0);
  }

  if (isDryRun) {
    console.log("\n🔍 DRY RUN COMPLETE — No changes were made.");
    process.exit(0);
  }

  // STEP 1: Process Content (Metadata, Sharp Optimization, Cloudinary CDN, DB Upsert, Social Captions)
  console.log("\n=======================================================");
  console.log("STEP 1: Processing Content & Syncing Database");
  console.log("=======================================================");
  await processContent();

  // Update hash manifest for all processed files
  for (const f of filesToTrack) {
    updateFileHash(f, manifest);
  }
  saveManifest(manifest);

  // STEP 2: Generate Series Documentation (unless skipped)
  if (!isSkipDocs) {
    console.log("\n=======================================================");
    console.log("STEP 2: Generating Series Master Documentation");
    console.log("=======================================================");
    try {
      await generateDocs();
    } catch (docErr) {
      console.warn("⚠️ Documentation generation failed, continuing pipeline:", docErr);
    }
  } else {
    console.log("\n⏭️ Skipping documentation generation (--skip-docs)");
  }

  // STEP 3: Git Commit & Push (unless skipped)
  if (!isNoGit) {
    console.log("\n=======================================================");
    console.log("STEP 3: Git Commit & Auto-Push for Live Deployment");
    console.log("=======================================================");
    try {
      console.log("  📦 Staging changed content, thumbnails, and docs...");
      execSync("git add Content/ .content-hashes.json", { stdio: "inherit" });

      const commitMsg = `content: publish & sync automated content pipeline (${new Date().toISOString().split("T")[0]})`;
      console.log(`  ✍️ Committing: "${commitMsg}"...`);
      execSync(`git commit -m "${commitMsg}"`, { stdio: "inherit" });

      console.log("  🚀 Pushing to main branch...");
      execSync("git push origin main", { stdio: "inherit" });
      console.log("  ✅ Push complete! Vercel will auto-deploy the changes.");
    } catch (gitErr: any) {
      console.warn("  ℹ️ Git push step skipped or no new git changes to commit.");
    }
  } else {
    console.log("\n⏭️ Skipping Git push (--no-git)");
  }

  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║  🎉 PIPELINE EXECUTION COMPLETE — EVERYTHING IS LIVE!        ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");
}

runMasterPipeline().catch((err) => {
  console.error("❌ Master pipeline error:", err);
  process.exit(1);
});
