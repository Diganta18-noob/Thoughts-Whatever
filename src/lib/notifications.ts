import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "content_warning"
  | "system_alert"
  | "security"
  | "job_failure"
  | "seo_issue"
  | "info";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface CreateNotificationInput {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  adminUserId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        type: input.type,
        severity: input.severity ?? "info",
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        metadata: input.metadata ?? undefined,
        adminUserId: input.adminUserId,
      },
    });
  } catch (err) {
    console.error("[Notification] Failed to create notification:", err);
    return null;
  }
}

export async function getNotifications(params?: {
  adminUserId?: string;
  unreadOnly?: boolean;
  limit?: number;
  severity?: string;
  type?: string;
}) {
  const where: any = {};

  if (params?.adminUserId) {
    where.OR = [{ adminUserId: params.adminUserId }, { adminUserId: null }];
  }

  if (params?.unreadOnly) {
    where.read = false;
  }

  if (params?.severity) {
    where.severity = params.severity;
  }

  if (params?.type) {
    where.type = params.type;
  }

  const [items, unreadCount, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params?.limit ?? 50,
    }),
    prisma.notification.count({
      where: {
        read: false,
        ...(params?.adminUserId
          ? { OR: [{ adminUserId: params.adminUserId }, { adminUserId: null }] }
          : {}),
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return { items, unreadCount, totalCount };
}

export async function markNotificationAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true, readAt: new Date() },
  });
}

export async function markAllNotificationsAsRead(adminUserId?: string) {
  return prisma.notification.updateMany({
    where: {
      read: false,
      ...(adminUserId
        ? { OR: [{ adminUserId }, { adminUserId: null }] }
        : {}),
    },
    data: { read: true, readAt: new Date() },
  });
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({ where: { id } });
}
