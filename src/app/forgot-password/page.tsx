import { redirect } from "next/navigation";

export default function ForgotPasswordRedirect() {
  redirect("/admin/forgot-password");
}
