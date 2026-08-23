import React from "react";
import toast from "react-hot-toast";

export interface ConfirmToastOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

/**
 * Replaces native browser confirm dialogs with an editorial-themed
 * interactive toast prompt containing Confirm / Cancel actions.
 */
export function confirmToast(
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: ConfirmToastOptions
): void {
  const confirmLabel = options?.confirmLabel || "Confirm";
  const cancelLabel = options?.cancelLabel || "Cancel";
  const isDanger = options?.variant === "danger";

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-fade-in" : "animate-fade-up"
        } max-w-sm w-full bg-surface-raised border border-rule shadow-2xl rounded-sm p-4 space-y-3 font-sans text-xs select-none`}
      >
        {options?.title && (
          <h4 className="font-serif text-sm font-semibold text-content">
            {options.title}
          </h4>
        )}
        <p className="text-content-soft leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule/60">
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="rounded-sm border border-rule bg-surface px-2.5 py-1 text-content-soft hover:text-content hover:bg-surface-raised transition text-[11px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t.id);
              await onConfirm();
            }}
            className={`rounded-sm px-3 py-1 font-medium text-white text-[11px] transition shadow-xs ${
              isDanger
                ? "bg-rose-700 hover:bg-rose-800"
                : "bg-accent hover:bg-accent/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    ),
    {
      duration: 8000,
      id: `confirm-${Date.now()}`,
    }
  );
}
