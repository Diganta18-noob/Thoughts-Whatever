import React from "react";
import { prisma } from "@/lib/prisma";
import { ReferenceAdminClient } from "./reference-admin-client";
import { ReferenceAnalyticsPanel } from "@/components/admin/reference-analytics-panel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reference Library | Admin",
};

export default async function AdminReferencePage() {
  const [works, [totalCount, rightsGroups]] = await Promise.all([
    prisma.referenceWork.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, nameBn: true, slug: true } },
        editions: {
          include: {
            rights: true,
            sources: true,
            assets: true,
            rightsLogs: {
              orderBy: { createdAt: "desc" },
              take: 3,
            },
          },
        },
      },
    }),
    Promise.all([
      prisma.referenceWork.count(),
      prisma.referenceRights.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]),
  ]);

  const serializedWorks = works.map((w) => ({
    ...w,
    editions: w.editions.map((ed) => ({
      ...ed,
      assets: ed.assets.map((a) => ({
        ...a,
        sizeBytes: a.sizeBytes ? Number(a.sizeBytes) : null,
      })),
    })),
  }));

  const rightsMap = new Map(rightsGroups.map((g) => [g.status, g._count._all]));
  const unverified = rightsMap.get("RIGHTS_UNVERIFIED") ?? 0;
  const restricted = rightsMap.get("RESTRICTED") ?? 0;

  const stats = {
    total: totalCount,
    publicDomain: rightsMap.get("PUBLIC_DOMAIN") ?? 0,
    licensed: rightsMap.get("LICENSED") ?? 0,
    external: rightsMap.get("EXTERNAL_SOURCE") ?? 0,
    unverified,
    restricted,
    reviewRequired: unverified + restricted,
  };

  return <div className="space-y-8"><ReferenceAnalyticsPanel /><ReferenceAdminClient initialWorks={serializedWorks} initialStats={stats} /></div>;
}
