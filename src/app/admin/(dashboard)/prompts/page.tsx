import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PromptsDashboard } from "@/components/admin/prompts/prompts-dashboard";

export const metadata = {
  title: "Prompt Library | Admin",
};

export default async function PromptsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return <PromptsDashboard />;
}
