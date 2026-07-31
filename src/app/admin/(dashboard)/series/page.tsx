import { prisma } from "@/lib/prisma";
import { SeriesManager } from "@/components/admin/series-manager";
import { SeriesChrome } from "./series-chrome";

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
      <SeriesChrome />
      <SeriesManager initialSeriesList={seriesList} />
    </div>
  );
}
