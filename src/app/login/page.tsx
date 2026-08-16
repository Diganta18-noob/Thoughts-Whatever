import { redirect } from "next/navigation";

export default function LoginRedirect({
  searchParams,
}: {
  searchParams: { from?: string; next?: string };
}) {
  const target = searchParams.from || searchParams.next;
  const param = target ? `?from=${encodeURIComponent(target)}` : "";
  redirect(`/admin/login${param}`);
}
