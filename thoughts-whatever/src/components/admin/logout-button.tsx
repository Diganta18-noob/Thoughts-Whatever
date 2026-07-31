"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const t = useTranslation();

  return (
    <button
      type="button"
      onClick={async () => {
        setBusy(true);
        await fetch("/api/admin/logout", { method: "POST" });
        router.refresh();
        router.replace("/admin/login");
      }}
      disabled={busy}
      className="inline-flex items-center gap-1.5 font-sans text-sm text-content-soft transition hover:text-accent disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      {t("admin.logout")}
    </button>
  );
}
