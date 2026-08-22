import { AdminProviders } from "@/components/providers/admin-providers";
import { QuickAddPromptModal } from "@/components/admin/prompts/quick-add-modal";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";

export const metadata: Metadata = {
  title: { default: "Editor", template: "%s — Editor" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <AdminProviders>
      <AdminLayoutClient
        adminEmail={admin.email}
        adminRole={admin.role}
      >
        {children}
      </AdminLayoutClient>
      <QuickAddPromptModal />
    </AdminProviders>
  );
}
