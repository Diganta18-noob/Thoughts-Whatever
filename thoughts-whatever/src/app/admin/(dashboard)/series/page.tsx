import { prisma } from "@/lib/prisma";
import { SeriesManager } from "@/components/admin/series-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Series Management" };

export default async function AdminSeriesPage() {
  const seriesList = await prisma.series.findMany({
    include: {
      pieces: {
        select: {
          id: true,
          slug: true,
          titleBn: true,
          kind: true,
          seriesOrder: true,
        },
        orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-rule pb-4">
        <span className="label" lang="en">
          Content Organization
        </span>
        <h1 className="mt-1 font-bengali text-2xl font-medium text-content" lang="bn">
          ধারাবাহিক ও পর্ব পরিচালনা
        </h1>
      </div>

      <SeriesManager initialSeriesList={seriesList} />
    </div>
  );
}
