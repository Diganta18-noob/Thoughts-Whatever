"use client";

import { useState } from "react";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";

interface ParsedRow {
  kind?: "RACHANA" | "BLOG" | "DOCUMENTARY";
  titleBn: string;
  titleEn?: string;
  subtitleBn?: string;
  dekBn?: string;
  bodyBn: string;
  reelUrl?: string;
  videoUrl?: string;
  coverImage?: string;
  seriesTitle?: string;
  seriesOrder?: number;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    const cols = (matches || lines[i].split(",")).map((c) =>
      c.trim().replace(/^"|"$/g, "").replace(/""/g, '"')
    );

    const getCol = (key: string) => {
      const idx = headers.findIndex((h) => h.toLowerCase() === key.toLowerCase());
      return idx >= 0 && cols[idx] ? cols[idx] : undefined;
    };

    const titleBn = getCol("titleBn") || getCol("title") || cols[0] || "";
    const bodyBn = getCol("bodyBn") || getCol("body") || getCol("content") || cols[1] || "";

    if (titleBn && bodyBn) {
      rows.push({
        titleBn,
        bodyBn,
        kind: (getCol("kind") as any) || "RACHANA",
        titleEn: getCol("titleEn"),
        subtitleBn: getCol("subtitleBn"),
        dekBn: getCol("dekBn") || getCol("excerpt"),
        reelUrl: getCol("reelUrl") || getCol("instagramUrl"),
        videoUrl: getCol("videoUrl"),
        coverImage: getCol("coverImage"),
        seriesTitle: getCol("seriesTitle") || getCol("series"),
        seriesOrder: getCol("seriesOrder") ? Number(getCol("seriesOrder")) : undefined,
      });
    }
  }

  return rows;
}

export function ImportForm() {
  const t = useTranslation();

  const [rawCSV, setRawCSV] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const handleTextChange = (text: string) => {
    setRawCSV(text);
    const parsed = parseCSV(text);
    setParsedRows(parsed);
    setResultMessage("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleTextChange(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0 || importing) return;
    setImporting(true);
    setResultMessage("");

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResultMessage(t("admin.import.success", { count: data.importedCount }));
        setRawCSV("");
        setParsedRows([]);
      } else {
        setResultMessage(data.error || t("letter.msg.failed"));
      }
    } catch {
      setResultMessage(t("letter.msg.network"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Upload & CSV Input */}
      <div className="border border-rule bg-surface p-6 space-y-4">
        <div>
          <span className="label">
            CSV Bulk Article Import
          </span>
          <h2 className="mt-1 font-sans text-lg font-medium text-content">
            {t("admin.import.title")}
          </h2>
          <p className="mt-1 font-sans text-xs text-content-soft">
            {t("admin.import.desc")}
          </p>
        </div>

        {/* File input */}
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 rounded-sm border border-rule px-4 py-2 font-sans text-sm text-content cursor-pointer transition hover:border-accent">
            <Upload className="h-4 w-4" />
            {t("admin.import.uploadLabel")}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <span className="font-mono text-xs text-content-faint">or paste raw CSV below</span>
        </div>

        {/* Textarea */}
        <textarea
          value={rawCSV}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={8}
          placeholder={`titleBn,bodyBn,kind,dekBn,reelUrl,seriesTitle\n"জীবনানন্দের রবীন্দ্রনাথ","রবীন্দ্রনাথকে নিয়ে জীবনানন্দের প্রবন্ধ...","RACHANA","মূল পরিচিতি...","https://www.instagram.com/reel/xxx","রবীন্দ্র-বীক্ষা"`}
          className="w-full rounded-sm border border-rule bg-surface p-3 font-mono text-xs text-content outline-none focus:border-accent"
        />
      </div>

      {resultMessage && (
        <div className="border-l-2 border-accent bg-accent/5 p-4 font-sans text-sm text-accent flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {resultMessage}
        </div>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="border border-rule bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="label">
                Import Preview ({parsedRows.length} Rows)
              </span>
              <h3 className="font-sans text-lg font-medium text-content">
                Import Preview
              </h3>
            </div>

            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-2 font-sans text-sm text-surface transition hover:opacity-90 disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              {t("admin.import.startBtn")} ({parsedRows.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-rule font-mono text-[0.6875rem] uppercase tracking-wider text-content-faint">
                  <th className="py-2.5 pr-4">{t("admin.pieces.tableTitle")}</th>
                  <th className="py-2.5 px-3">{t("admin.pieces.tableKind")}</th>
                  <th className="py-2.5 px-3">{t("admin.series.name")}</th>
                  <th className="py-2.5 pl-3">Reel URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60">
                {parsedRows.map((r, i) => (
                  <tr key={i} className="transition hover:bg-surface-raised">
                    <td className="py-2.5 pr-4 font-bengali text-sm text-content font-medium" lang="bn">
                      {r.titleBn}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-content-soft">
                      {r.kind || "RACHANA"}
                    </td>
                    <td className="py-2.5 px-3 font-bengali text-xs text-content-faint" lang="bn">
                      {r.seriesTitle || "—"}
                    </td>
                    <td className="py-2.5 pl-3 font-mono text-xs text-content-faint max-w-[200px] truncate">
                      {r.reelUrl || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
