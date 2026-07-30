"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

/**
 * Delete, with the confirm step in the browser rather than a route of its own.
 *
 * The piece title is in the prompt on purpose — "Delete this piece?" is easy to
 * click through on the wrong row.
 */
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

  async function onClick() {
    if (busy) return;
    if (!window.confirm(`"${titleBn}" মুছে ফেলা হবে। ফেরানো যাবে না।`)) return;

    setBusy(true);
    const res = await fetch(`/api/admin/pieces/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      window.alert(data.error || "মোছা গেল না।");
      setBusy(false);
      return;
    }
    if (redirectTo) router.replace(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title="মুছুন"
      className="text-content-faint transition hover:text-accent disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      <span className="sr-only">মুছুন</span>
    </button>
  );
}
