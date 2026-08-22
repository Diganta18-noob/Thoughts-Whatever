import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth";

export interface LogActivityInput {
  type: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  actorId?: string;
  actorEmail?: string;
  actorName?: string;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    let actorId = input.actorId;
    let actorEmail = input.actorEmail;
    let actorName = input.actorName;

    if (!actorId) {
      const session = readSession();
      if (session) {
        actorId = session.sub;
        actorEmail = session.email || actorEmail;
        const user = await prisma.adminUser.findUnique({
          where: { id: session.sub },
          select: { nameBn: true, email: true },
        });
        actorName = user?.nameBn || actorName || undefined;
        actorEmail = user?.email || actorEmail;
      }
    }

    await prisma.activity.create({
      data: {
        type: input.type,
        summary: input.summary,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
        actorId: actorId ?? null,
        actorEmail: actorEmail ?? null,
        actorName: actorName ?? null,
      },
    });
  } catch (err) {
    console.error("[ActivityLog] Failed to record activity:", err);
  }
}

export async function getRecentActivities(limit: number = 20, typeFilter?: string) {
  return prisma.activity.findMany({
    where: typeFilter ? { type: { startsWith: typeFilter } } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      adminUser: {
        select: { id: true, email: true, nameBn: true, role: true },
      },
    },
  });
}
