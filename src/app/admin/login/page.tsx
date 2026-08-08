import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isSafeInternalPath } from "@/middleware";
import { LoginForm } from "./login-form";
import { LoginChrome } from "./login-chrome";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string; from?: string };
}) {
  const admin = await requireAdmin();
  
  const rawTarget = searchParams.from || searchParams.next;
  const destination = isSafeInternalPath(rawTarget) && rawTarget?.startsWith("/admin")
    ? rawTarget
    : "/admin";

  if (admin) redirect(destination);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <LoginChrome />
        <LoginForm next={destination} />
      </div>
    </div>
  );
}
