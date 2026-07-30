import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EMPTY_PIECE, PieceEditor } from "@/components/admin/piece-editor";
import { getEditorOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export const metadata = { title: "New piece" };

const KINDS = ["RACHANA", "BLOG", "DOCUMENTARY"] as const;

export default async function NewPiecePage({
  searchParams,
}: {
  searchParams: { kind?: string };
}) {
  const { authors, tags, series } = await getEditorOptions();

  // `/admin/pieces/new?kind=DOCUMENTARY` from the dashboard skips a click.
  const kind = KINDS.find((k) => k === searchParams.kind) ?? "RACHANA";

  return (
    <div>
      <Link
        href="/admin/pieces"
        className="inline-flex items-center gap-1.5 font-serif text-sm text-content-soft transition hover:text-accent"
        lang="en"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All pieces
      </Link>

      <div className="mt-6">
        <PieceEditor
          initial={{ ...EMPTY_PIECE, kind }}
          authors={authors}
          tags={tags}
          series={series}
        />
      </div>
    </div>
  );
}
