import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuditLogDashboard } from "@/components/admin/audit-log-dashboard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Audit Log | Admin Dashboard",
};

export default async function AuditLogPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return <AuditLogDashboard />;
}
