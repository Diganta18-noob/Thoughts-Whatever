import { requireAdmin } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PromptForm } from "@/components/admin/prompts/prompt-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Edit Prompt | Admin",
};

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function PromptDetailPage(props: PageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const rawParams = await props?.params;
  const id = rawParams?.id;
  if (!id) notFound();

  const prompt = await prisma.promptLog.findUnique({
    where: { id },
  });

  if (!prompt) notFound();

  return <PromptForm initialData={prompt} isEditing />;
}
