import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PromptForm } from "@/components/admin/prompts/prompt-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Add Prompt | Admin",
};

export default async function NewPromptPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return <PromptForm />;
}
