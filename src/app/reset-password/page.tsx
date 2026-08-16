import { redirect } from "next/navigation";

export default function ResetPasswordRedirect({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ? `?token=${encodeURIComponent(searchParams.token)}` : "";
  redirect(`/admin/reset-password${token}`);
}
