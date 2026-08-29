import React from "react";
import hotToast, { ToastOptions, Toast } from "react-hot-toast";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Trash2 } from "lucide-react";

export interface ConfirmToastOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  duration?: number;
}

/**
 * Non-blocking interactive confirmation toast.
 * Displays a non-modal prompt containing a title, message, and Cancel / Delete actions.
 */
export function confirmToast(
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: ConfirmToastOptions
): string {
  const confirmLabel = options?.confirmLabel || (options?.variant === "danger" ? "Delete" : "Confirm");
  const cancelLabel = options?.cancelLabel || "Cancel";
  const isDanger = options?.variant === "danger";
  const isWarning = options?.variant === "warning";
  const title = options?.title || (isDanger ? "Confirm Deletion" : "Are you sure?");
  const duration = options?.duration ?? 12000;

  return hotToast.custom(
    (t: Toast) => (
      <div
        role="alertdialog"
        aria-modal="false"
        aria-labelledby={`confirm-toast-title-${t.id}`}
        aria-describedby={`confirm-toast-desc-${t.id}`}
        className={`${
          t.visible ? "animate-fade-in" : "animate-fade-up"
        } max-w-sm w-full bg-surface-raised/95 backdrop-blur-md border border-rule shadow-2xl rounded-lg p-4 space-y-3 font-sans text-xs select-none ring-1 ring-white/10`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
              isDanger
                ? "bg-rose-500/15 text-rose-500"
                : isWarning
                ? "bg-amber-500/15 text-amber-500"
                : "bg-accent/15 text-accent"
            }`}
          >
            {isDanger ? (
              <Trash2 className="h-4 w-4" />
            ) : isWarning ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <h4
              id={`confirm-toast-title-${t.id}`}
              className="font-serif text-sm font-semibold text-content leading-snug"
            >
              {title}
            </h4>
            <p
              id={`confirm-toast-desc-${t.id}`}
              className="text-content-soft text-[12px] leading-relaxed break-words"
            >
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule/60">
          <button
            type="button"
            onClick={() => hotToast.dismiss(t.id)}
            className="rounded-md border border-rule bg-surface px-3 py-1.5 text-content-soft hover:text-content hover:bg-surface-raised transition font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              hotToast.dismiss(t.id);
              try {
                await onConfirm();
              } catch (err: any) {
                console.error("Confirmation action error:", err);
                hotToast.error(err?.message || "Action failed");
              }
            }}
            className={`rounded-md px-3.5 py-1.5 font-semibold text-white text-[11px] transition shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-surface ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
                : isWarning
                ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                : "bg-accent hover:opacity-90 focus:ring-accent"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    ),
    {
      duration,
      id: `confirm-${Date.now()}`,
      position: "bottom-center",
    }
  );
}
