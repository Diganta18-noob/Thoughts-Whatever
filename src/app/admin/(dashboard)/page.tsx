import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CustomDashboard } from "@/components/admin/custom-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editorial overview" };

async function DashboardDataFetcher() {
  // Detailed analytics load only on their own screen or explicitly opened widgets.
  const [recent, drafts, scheduled, failedJobs] = await Promise.allSettled([
    prisma.piece.findMany({
      select: { id: true, slug: true, kind: true, status: true, titleBn: true, updatedAt: true },
      orderBy: { updatedAt: "desc" }, take: 8,
    }),
    prisma.piece.count({ where: { status: "DRAFT", OR: [{ reviewStatus: null }, { reviewStatus: { not: "scheduled" } }] } }),
    prisma.piece.count({ where: { status: "DRAFT", reviewStatus: "scheduled" } }),
    prisma.scheduledJob.count({ where: { status: "FAILED" } }),
  ]);
  return <CustomDashboard
    recentPieces={recent.status === "fulfilled" ? recent.value : []}
    recentError={recent.status === "rejected"}
    workSummary={{
      drafts: drafts.status === "fulfilled" ? drafts.value : null,
      scheduled: scheduled.status === "fulfilled" ? scheduled.value : null,
      failedJobs: failedJobs.status === "fulfilled" ? failedJobs.value : null,
    }}
  />;
}

export default function AdminHomePage() {
  return <Suspense fallback={<p role="status" className="text-sm text-content-soft">Loading your editorial overview…</p>}>
    <DashboardDataFetcher />
  </Suspense>;
}
