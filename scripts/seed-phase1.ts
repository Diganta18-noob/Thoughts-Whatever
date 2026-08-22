import dotenv from "dotenv";
dotenv.config();

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding Phase 1 initial data...");

  // 1. Promote all existing admin users to SUPER_ADMIN
  const updatedAdmins = await prisma.adminUser.updateMany({
    data: {
      role: "SUPER_ADMIN",
      status: "active",
      lastActiveAt: new Date(),
    },
  });
  console.log(`✅ Promoted ${updatedAdmins.count} admin user(s) to SUPER_ADMIN`);

  const primaryAdmin = await prisma.adminUser.findFirst();

  if (primaryAdmin) {
    // 2. Create initial welcome notification if none exist
    const notificationCount = await prisma.notification.count();
    if (notificationCount === 0) {
      await prisma.notification.createMany({
        data: [
          {
            type: "system_alert",
            severity: "info",
            title: "Editor's Room Upgrade Complete",
            message: "Phase 1 Foundation upgrade has been deployed with RBAC, Command Palette, and Notification Center.",
            read: false,
            adminUserId: primaryAdmin.id,
            actionUrl: "/admin/team",
          },
          {
            type: "security",
            severity: "info",
            title: "Super Admin Role Assigned",
            message: `Your account (${primaryAdmin.email}) has been granted SUPER_ADMIN privileges with full system authority.`,
            read: false,
            adminUserId: primaryAdmin.id,
            actionUrl: "/admin/security",
          },
        ],
      });
      console.log("✅ Initial notifications created");
    }

    // 3. Log initial system upgrade activity
    const activityCount = await prisma.activity.count();
    if (activityCount === 0) {
      await prisma.activity.createMany({
        data: [
          {
            type: "system.upgrade",
            actorId: primaryAdmin.id,
            actorEmail: primaryAdmin.email,
            actorName: primaryAdmin.nameBn || "Admin",
            summary: "Advanced Editor's Room Operating System upgraded to Phase 1",
            entityType: "System",
            metadata: { version: "2.0.0", phase: "Foundation" },
          },
          {
            type: "user.role_assigned",
            actorId: primaryAdmin.id,
            actorEmail: primaryAdmin.email,
            actorName: primaryAdmin.nameBn || "Admin",
            summary: `Assigned SUPER_ADMIN role to ${primaryAdmin.email}`,
            entityType: "AdminUser",
            entityId: primaryAdmin.id,
          },
        ],
      });
      console.log("✅ Initial activity logs created");
    }
  }

  console.log("🎉 Phase 1 seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
