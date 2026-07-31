import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { LoginChrome } from "./login-chrome";

/**
 * Deliberately outside the (dashboard) route group.
 *
 * If the auth gate lived in `admin/layout.tsx` it would also wrap this page,
 * and a logged-out visitor would be redirected to the login page by the login
 * page — forever.
 */

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const admin = await requireAdmin();
  const next =
    searchParams.next?.startsWith("/admin") ? searchParams.next : "/admin";

  if (admin) redirect(next);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <LoginChrome />
        <LoginForm next={next} />
      </div>
    </div>
  );
}
