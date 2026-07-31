import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";
import { SettingsChrome } from "./settings-chrome";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const currentAdmin = await requireAdmin();

  const adminUsers = await prisma.adminUser.findMany({
    select: { id: true, email: true, nameBn: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <SettingsChrome />
      <SettingsForm
        adminUsers={adminUsers}
        currentAdminEmail={currentAdmin?.email || ""}
      />
    </div>
  );
}
