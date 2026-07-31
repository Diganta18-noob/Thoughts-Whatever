import { ImportForm } from "@/components/admin/import-form";
import { ImportChrome } from "./import-chrome";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bulk Import" };

export default function AdminImportPage() {
  return (
    <div className="space-y-6">
      <ImportChrome />
      <ImportForm />
    </div>
  );
}
