import React from "react";
import { prisma } from "@/lib/prisma";
import { ReferenceAdminClient } from "./reference-admin-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reference Library | Admin",
};

export default async function AdminReferencePage() {
  const [works, statsGroup] = await Promise.all([
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
      prisma.referenceRights.count({ where: { status: "PUBLIC_DOMAIN" } }),
      prisma.referenceRights.count({ where: { status: "LICENSED" } }),
      prisma.referenceRights.count({ where: { status: "EXTERNAL_SOURCE" } }),
      prisma.referenceRights.count({ where: { status: "RIGHTS_UNVERIFIED" } }),
      prisma.referenceRights.count({ where: { status: "RESTRICTED" } }),
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

  const stats = {
    total: statsGroup[0],
    publicDomain: statsGroup[1],
    licensed: statsGroup[2],
    external: statsGroup[3],
    unverified: statsGroup[4],
    restricted: statsGroup[5],
    reviewRequired: statsGroup[4] + statsGroup[5],
  };

  return <ReferenceAdminClient initialWorks={serializedWorks} initialStats={stats} />;
}
