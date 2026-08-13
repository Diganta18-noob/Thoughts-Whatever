import { requireAdmin } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PromptForm } from "@/components/admin/prompts/prompt-form";

export const metadata = {
  title: "Edit Prompt | Admin",
};

export default async function PromptDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const prompt = await prisma.promptLog.findUnique({
    where: { id: params.id },
  });

  if (!prompt) notFound();

  return <PromptForm initialData={prompt} isEditing />;
}
