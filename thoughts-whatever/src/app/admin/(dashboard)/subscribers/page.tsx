import { prisma } from "@/lib/prisma";
import { SubscribersClient } from "./subscribers-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Letter" };

export default async function SubscribersPage() {
  const [active, gone, recent] = await Promise.all([
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.subscriber.findMany({
      select: {
        id: true,
        email: true,
        nameBn: true,
        source: true,
        createdAt: true,
        unsubscribedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return <SubscribersClient active={active} gone={gone} recent={recent} />;
}
