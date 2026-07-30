import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";

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
      <div className="border-b border-rule pb-4">
        <span className="label" lang="en">
          System Management
        </span>
        <h1 className="mt-1 font-bengali text-2xl font-medium text-content" lang="bn">
          সেটিংস ও নিরাপত্তা
        </h1>
      </div>

      <SettingsForm
        adminUsers={adminUsers}
        currentAdminEmail={currentAdmin?.email || ""}
      />
    </div>
  );
}
