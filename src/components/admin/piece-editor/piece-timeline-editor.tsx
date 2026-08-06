"use client";

import { Plus, Trash2 } from "lucide-react";
import type { TimelineInput } from "./piece-editor-types";

export function PieceTimelineEditor({
  timeline,
  onChange,
  inputClass,
  t,
}: {
  timeline: TimelineInput[];
  onChange: (timeline: TimelineInput[]) => void;
  inputClass: string;
  t: (key: any, params?: any) => string;
}) {

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-wider text-content-soft">
          {t("admin.editor.timeline")}
        </h3>
        <button
          type="button"
          onClick={() =>
            onChange([...timeline, { year: "", labelBn: "", descBn: "" }])
          }
          className="inline-flex items-center gap-1 font-sans text-xs text-accent transition hover:opacity-75"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("admin.editor.addTimelineEvent")}
        </button>
      </div>

      {timeline.map((item, i) => (
        <div
          key={i}
          className="relative space-y-2 rounded-sm border border-rule/60 p-3"
        >
          <button
            type="button"
            onClick={() => onChange(timeline.filter((_, idx) => idx !== i))}
            className="absolute top-2 right-2 text-content-faint hover:text-accent"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <div className="grid gap-2 sm:grid-cols-[100px_minmax(0,1fr)]">
            <input
              value={item.year}
              onChange={(e) => {
                const next = [...timeline];
                next[i] = { ...next[i], year: e.target.value };
                onChange(next);
              }}
              placeholder={t("admin.editor.yearPlaceholder")}
              lang="bn"
              className={inputClass}
            />
            <input
              value={item.labelBn}
              onChange={(e) => {
                const next = [...timeline];
                next[i] = { ...next[i], labelBn: e.target.value };
                onChange(next);
              }}
              placeholder={t("admin.editor.eventLabelPlaceholder")}
              lang="bn"
              className={inputClass}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
