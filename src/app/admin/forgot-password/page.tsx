import type { Metadata } from "next";
import { LoginChrome } from "../login/login-chrome";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Password | Thoughts Whatever",
  robots: { index: false, follow: false },
};

export default function AdminForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <LoginChrome />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
