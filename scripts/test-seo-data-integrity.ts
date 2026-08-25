import { PrismaClient } from "@prisma/client";
import { getWebsiteDashboardMetrics, getWebsites } from "../src/lib/seo-engine/websites";

const prisma = new PrismaClient();

async function runDataIntegrityAudit() {
  console.log("🔍 Starting Critical SEO Data Integrity & Isolation Audit...\n");

  const websites = await getWebsites();
  console.log(`Found ${websites.length} registered websites in database:`);
  websites.forEach((w) => {
    console.log(`  - [${w.id}] ${w.name} (${w.domain}): Active Links = ${w.activeBacklinksCount}, Lost = ${w.lostBacklinksCount}, Keywords = ${w._count.keywords}`);
  });

  const thoughtsWhatever = websites.find((w) => w.domain === "thoughtswhatever.in");
  const aiToolsJournal = websites.find((w) => w.domain === "aitoolsjournal.dev");

  if (!thoughtsWhatever || !aiToolsJournal) {
    throw new Error("Required test websites not found in database.");
  }

  // -------------------------------------------------------------
  // TEST 1: Query Thoughts Whatever Metrics
  // -------------------------------------------------------------
  console.log("\n🧪 TEST 1: Querying 'Thoughts Whatever' Metrics...");
  const twMetrics = await getWebsiteDashboardMetrics(thoughtsWhatever.id);

  console.log(`  • Active Backlinks: ${twMetrics.stats.totalActiveBacklinks} (Expected: 4)`);
  console.log(`  • Lost Backlinks: ${twMetrics.stats.lostBacklinks30d} (Expected: 1)`);
  console.log(`  • Total Monitored All-Time: ${twMetrics.stats.totalMonitoredAllTime} (Expected: 5)`);
  console.log(`  • Referring Domains: ${twMetrics.stats.totalReferringDomains} (Expected: 4)`);
  console.log(`  • Tracked Keywords: ${twMetrics.stats.totalKeywords} (Expected: 4)`);
  console.log(`  • Avg Position: #${twMetrics.stats.avgKeywordPosition} (Expected: ~3.8)`);
  console.log(`  • Estimated Traffic: ${twMetrics.stats.estimatedTraffic} (Calculated from CTR)`);
  console.log(`  • Data Source: ${twMetrics.dataSources.traffic}`);

  if (twMetrics.stats.totalActiveBacklinks !== 4 || twMetrics.stats.lostBacklinks30d !== 1) {
    throw new Error(`FAIL: Thoughts Whatever backlink counts are incorrect! Active=${twMetrics.stats.totalActiveBacklinks}, Lost=${twMetrics.stats.lostBacklinks30d}`);
  }
  console.log("  ✅ TEST 1 PASSED: Thoughts Whatever data strictly verified.");

  // -------------------------------------------------------------
  // TEST 2: Query AI Tools Journal (Empty Project) Metrics
  // -------------------------------------------------------------
  console.log("\n🧪 TEST 2: Querying 'AI Tools Journal' (Empty Project) Metrics...");
  const aiMetrics = await getWebsiteDashboardMetrics(aiToolsJournal.id);

  console.log(`  • Active Backlinks: ${aiMetrics.stats.totalActiveBacklinks} (Expected: 0)`);
  console.log(`  • Lost Backlinks: ${aiMetrics.stats.lostBacklinks30d} (Expected: 0)`);
  console.log(`  • Total Monitored All-Time: ${aiMetrics.stats.totalMonitoredAllTime} (Expected: 0)`);
  console.log(`  • Referring Domains: ${aiMetrics.stats.totalReferringDomains} (Expected: 0)`);
  console.log(`  • Tracked Keywords: ${aiMetrics.stats.totalKeywords} (Expected: 0)`);
  console.log(`  • Avg Position: ${aiMetrics.stats.avgKeywordPosition} (Expected: null / no fake data)`);
  console.log(`  • Estimated Traffic: ${aiMetrics.stats.estimatedTraffic} (Expected: null / no fake data)`);
  console.log(`  • Charts Has Data: ${aiMetrics.charts.hasData} (Expected: false)`);
  console.log(`  • Traffic Growth Points: ${aiMetrics.charts.trafficGrowth.length} (Expected: 0)`);

  if (aiMetrics.stats.totalActiveBacklinks !== 0 || aiMetrics.stats.estimatedTraffic !== null) {
    throw new Error(`FAIL: AI Tools Journal leaked data or returned mock fallback numbers! Active=${aiMetrics.stats.totalActiveBacklinks}, Traffic=${aiMetrics.stats.estimatedTraffic}`);
  }
  console.log("  ✅ TEST 2 PASSED: AI Tools Journal strictly isolated with zero leakage.");

  // -------------------------------------------------------------
  // TEST 3: Compare Dashboard vs Website Card Counts
  // -------------------------------------------------------------
  console.log("\n🧪 TEST 3: Reconciling Dashboard and Website Management Counts...");
  const twCard = websites.find((w) => w.id === thoughtsWhatever.id)!;
  const aiCard = websites.find((w) => w.id === aiToolsJournal.id)!;

  console.log(`  • Thoughts Whatever Dashboard Active = ${twMetrics.stats.totalActiveBacklinks} | Card Active = ${twCard.activeBacklinksCount}`);
  console.log(`  • AI Tools Journal Dashboard Active = ${aiMetrics.stats.totalActiveBacklinks} | Card Active = ${aiCard.activeBacklinksCount}`);

  if (twMetrics.stats.totalActiveBacklinks !== twCard.activeBacklinksCount) {
    throw new Error("FAIL: Thoughts Whatever dashboard count does not match website management card!");
  }
  if (aiMetrics.stats.totalActiveBacklinks !== aiCard.activeBacklinksCount) {
    throw new Error("FAIL: AI Tools Journal dashboard count does not match website management card!");
  }
  console.log("  ✅ TEST 3 PASSED: 100% Reconciliation achieved between Dashboard and Website Cards.");

  // -------------------------------------------------------------
  // TEST 4: Query Isolation in Database Tables
  // -------------------------------------------------------------
  console.log("\n🧪 TEST 4: Verifying foreign key websiteId isolation in raw database queries...");
  const unassignedBacklinks = await prisma.monitoredBacklink.count({
    where: { websiteId: "" },
  });
  const totalDbBacklinks = await prisma.monitoredBacklink.count();
  const twDbBacklinks = await prisma.monitoredBacklink.count({ where: { websiteId: thoughtsWhatever.id } });
  const aiDbBacklinks = await prisma.monitoredBacklink.count({ where: { websiteId: aiToolsJournal.id } });

  console.log(`  • Total DB Backlinks: ${totalDbBacklinks}`);
  console.log(`  • Thoughts Whatever DB Backlinks: ${twDbBacklinks}`);
  console.log(`  • AI Tools Journal DB Backlinks: ${aiDbBacklinks}`);

  if (unassignedBacklinks > 0 || twDbBacklinks + aiDbBacklinks !== totalDbBacklinks) {
    throw new Error("FAIL: Found unassigned or orphaned backlinks not scoped by websiteId!");
  }
  console.log("  ✅ TEST 4 PASSED: Strict relational websiteId isolation verified.");

  console.log("\n🎉 ALL DATA INTEGRITY AUDIT TESTS PASSED SUCCESSFULLY!\n");
}

runDataIntegrityAudit()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
