import type { Metadata } from "next";
import { LoginChrome } from "../login/login-chrome";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Create New Password | Thoughts Whatever",
  robots: { index: false, follow: false },
};

export default function AdminResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <LoginChrome />
        <ResetPasswordForm />
      </div>
    </div>
  );
}
