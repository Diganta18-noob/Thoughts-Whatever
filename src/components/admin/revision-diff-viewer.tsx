"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface RevisionDiffViewerProps {
  originalText: string;
  revisedText: string;
  originalLabel?: string;
  revisedLabel?: string;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
  lineA?: number;
  lineB?: number;
}

// Lightweight line-by-line diff algorithm
function computeLineDiff(textA: string, textB: string): DiffLine[] {
  const linesA = textA.split("\n");
  const linesB = textB.split("\n");
  const result: DiffLine[] = [];

  let i = 0;
  let j = 0;
  let lineNumA = 1;
  let lineNumB = 1;

  while (i < linesA.length || j < linesB.length) {
    if (i < linesA.length && j < linesB.length) {
      if (linesA[i] === linesB[j]) {
        result.push({
          type: "unchanged",
          text: linesA[i],
          lineA: lineNumA++,
          lineB: lineNumB++,
        });
        i++;
        j++;
      } else {
        // Lookahead to see if line A was removed or line B was added
        const nextMatchInB = linesB.indexOf(linesA[i], j);
        const nextMatchInA = linesA.indexOf(linesB[j], i);

        if (nextMatchInB !== -1 && (nextMatchInA === -1 || nextMatchInB <= nextMatchInA)) {
          // Lines in B were added
          result.push({
            type: "added",
            text: linesB[j],
            lineB: lineNumB++,
          });
          j++;
        } else {
          // Line in A was removed
          result.push({
            type: "removed",
            text: linesA[i],
            lineA: lineNumA++,
          });
          i++;
        }
      }
    } else if (i < linesA.length) {
      result.push({
        type: "removed",
        text: linesA[i],
        lineA: lineNumA++,
      });
      i++;
    } else if (j < linesB.length) {
      result.push({
        type: "added",
        text: linesB[j],
        lineB: lineNumB++,
      });
      j++;
    }
  }

  return result;
}

export function RevisionDiffViewer({
  originalText,
  revisedText,
  originalLabel = "Older Version",
  revisedLabel = "Newer Version",
}: RevisionDiffViewerProps) {
  const diffLines = useMemo(() => {
    return computeLineDiff(originalText || "", revisedText || "");
  }, [originalText, revisedText]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const l of diffLines) {
      if (l.type === "added") added++;
      if (l.type === "removed") removed++;
    }
    return { added, removed };
  }, [diffLines]);

  return (
    <div className="rounded-sm border border-rule bg-surface-raised overflow-hidden text-xs font-mono">
      {/* Diff Header */}
      <div className="flex items-center justify-between border-b border-rule bg-surface/80 px-4 py-2 text-[11px]">
        <div className="flex items-center gap-4">
          <span className="text-content-soft font-sans font-medium">
            Comparing: <strong className="text-content">{originalLabel}</strong> &rarr;{" "}
            <strong className="text-content">{revisedLabel}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">+{stats.added}</span>
          <span className="text-rule">/</span>
          <span className="text-rose-700 dark:text-rose-400 font-bold">-{stats.removed}</span>
        </div>
      </div>

      {/* Diff Code Rows */}
      <div className="max-h-[600px] overflow-y-auto font-mono text-[12px] leading-relaxed">
        {diffLines.map((line, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start px-2 py-0.5 border-b border-rule/30 transition",
              line.type === "added" && "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-medium",
              line.type === "removed" && "bg-rose-500/10 text-rose-900 dark:text-rose-300 line-through opacity-80",
              line.type === "unchanged" && "text-content-soft hover:bg-surface"
            )}
          >
            {/* Line numbers */}
            <span className="w-8 shrink-0 text-right pr-2 select-none text-content-faint text-[10px]">
              {line.lineA || ""}
            </span>
            <span className="w-8 shrink-0 text-right pr-2 select-none text-content-faint text-[10px]">
              {line.lineB || ""}
            </span>
            <span className="w-4 shrink-0 text-center select-none font-bold">
              {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
            </span>

            {/* Line content */}
            <pre className="min-w-0 flex-1 whitespace-pre-wrap font-sans text-xs break-words">
              {line.text || " "}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
