"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { confirmToast } from "@/lib/confirm-toast";
import { useTranslation } from "@/components/providers/language-provider";

export function DeletePieceButton({
  id,
  titleBn,
  redirectTo,
}: {
  id: string;
  titleBn: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const t = useTranslation();

  function onClick() {
    if (busy) return;
    confirmToast(
      `Are you sure you want to delete "${titleBn}"? This action cannot be undone.`,
      async () => {
        setBusy(true);
        const res = await fetch(`/api/admin/pieces/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(data.error || t("letter.msg.failed"));
          setBusy(false);
          return;
        }
        toast.success("Piece deleted");
        if (redirectTo) router.replace(redirectTo);
        router.refresh();
      },
      { title: "Delete Piece", confirmLabel: "Delete Piece", variant: "danger" }
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={t("common.delete")}
      className="text-content-faint transition hover:text-accent disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      <span className="sr-only">{t("common.delete")}</span>
    </button>
  );
}
