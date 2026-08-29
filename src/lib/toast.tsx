import React from "react";
import hotToast, { ToastOptions, Toast } from "react-hot-toast";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { confirmToast, ConfirmToastOptions } from "./confirm-toast";

/**
 * Centralized Application Toast System
 *
 * Provides typed, consistent notification methods styled to match
 * the application's dark/light aesthetic.
 */
export const toast = Object.assign(
  (message: any, opts?: ToastOptions) => hotToast(message, opts),
  hotToast,
  {
    success: (message: string, opts?: ToastOptions) =>
      hotToast.success(message, {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
        ...opts,
      }),

    error: (message: string, opts?: ToastOptions) =>
      hotToast.error(message, {
        icon: <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />,
        ...opts,
      }),

    warning: (message: string, opts?: ToastOptions) =>
      hotToast(message, {
        icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
        style: {
          border: "1px solid rgba(245, 158, 11, 0.3)",
          ...opts?.style,
        },
        ...opts,
      }),

    info: (message: string, opts?: ToastOptions) =>
      hotToast(message, {
        icon: <Info className="h-4 w-4 text-sky-500 shrink-0" />,
        style: {
          border: "1px solid rgba(14, 165, 233, 0.3)",
          ...opts?.style,
        },
        ...opts,
      }),

    confirm: confirmToast,
  }
);

export { confirmToast };
export type { ConfirmToastOptions };
export default toast;
