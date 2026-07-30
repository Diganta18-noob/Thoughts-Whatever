import { ImportForm } from "@/components/admin/import-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bulk Import" };

export default function AdminImportPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-rule pb-4">
        <span className="label" lang="en">
          Content Migration
        </span>
        <h1 className="mt-1 font-bengali text-2xl font-medium text-content" lang="bn">
          ইনস্টাগ্রাম ও লেখার বাল্ক ইম্পোর্ট
        </h1>
      </div>

      <ImportForm />
    </div>
  );
}
