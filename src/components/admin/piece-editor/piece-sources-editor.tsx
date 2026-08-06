"use client";

import { Plus, Trash2 } from "lucide-react";
import type { SourceInput } from "./piece-editor-types";

export function PieceSourcesEditor({
  sources,
  onChange,
  monoInputClass,
  inputClass,
  t,
}: {
  sources: SourceInput[];
  onChange: (sources: SourceInput[]) => void;
  monoInputClass: string;
  inputClass: string;
  t: (key: any, params?: any) => string;
}) {

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-wider text-content-soft">
          {t("admin.editor.sources")}
        </h3>
        <button
          type="button"
          onClick={() =>
            onChange([...sources, { label: "", url: "", note: "" }])
          }
          className="inline-flex items-center gap-1 font-sans text-xs text-accent transition hover:opacity-75"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("admin.editor.addSource")}
        </button>
      </div>

      {sources.map((s, i) => (
        <div
          key={i}
          className="relative space-y-2 rounded-sm border border-rule/60 p-3"
        >
          <button
            type="button"
            onClick={() => onChange(sources.filter((_, idx) => idx !== i))}
            className="absolute top-2 right-2 text-content-faint hover:text-accent"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <input
            value={s.label}
            onChange={(e) => {
              const next = [...sources];
              next[i] = { ...next[i], label: e.target.value };
              onChange(next);
            }}
            placeholder={t("admin.editor.sourceLabelPlaceholder")}
            lang="bn"
            className={inputClass}
          />
          <input
            value={s.url}
            onChange={(e) => {
              const next = [...sources];
              next[i] = { ...next[i], url: e.target.value };
              onChange(next);
            }}
            placeholder="https://…"
            className={monoInputClass}
          />
        </div>
      ))}
    </div>
  );
}
