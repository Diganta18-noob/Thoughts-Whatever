import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

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
        <span className="label" lang="en">
          Thoughts Whatever
        </span>
        <h1
          className="mt-3 font-bengali text-[1.5rem] font-medium text-content"
          lang="bn"
        >
          সম্পাদকের ঘর
        </h1>
        <p
          className="mt-2 font-bengali text-bengali-sm text-content-soft"
          lang="bn"
        >
          লেখা তৈরি, সম্পাদনা আর প্রকাশ — সবই এখান থেকে।
        </p>

        <LoginForm next={next} />
      </div>
    </div>
  );
}
