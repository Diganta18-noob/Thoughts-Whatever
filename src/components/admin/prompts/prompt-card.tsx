"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Tag as TagIcon,
  ExternalLink,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Bookmark
} from "lucide-react";
import { toast } from "react-hot-toast";

export interface PromptItem {
  id: string;
  text: string;
  summary?: string | null;
  source: string;
  category: string;
  status: string;
  tags: string[];
  linkedTo?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PromptCardProps {
  prompt: PromptItem;
  onStatusChange?: (id: string, newStatus: string) => void;
  onDelete?: (id: string) => void;
}

export function PromptCard({ prompt, onStatusChange, onDelete }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    toast.success("Prompt text copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "in-progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "planned":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "rejected":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: // idea
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source.toLowerCase()) {
      case "kiro":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "antigravity":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "manual":
        return "bg-surface-raised text-content-soft border-rule";
      default:
        return "bg-surface-raised text-content-soft border-rule";
    }
  };

  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="group rounded-sm border border-rule bg-surface p-4 transition hover:border-rule/80 hover:bg-surface-raised/40 space-y-3">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule/50 pb-2.5">
        <div className="flex items-center gap-2">
          {/* Status Select */}
          <select
            value={prompt.status}
            onChange={(e) => onStatusChange?.(prompt.id, e.target.value)}
            className={`rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold capitalize focus:outline-none transition cursor-pointer ${getStatusBadge(
              prompt.status
            )}`}
          >
            <option value="idea">💡 idea</option>
            <option value="planned">🟡 planned</option>
            <option value="in-progress">🔵 in-progress</option>
            <option value="done">🟢 done</option>
            <option value="rejected">🔴 rejected</option>
          </select>

          {/* Source Badge */}
          <span
            className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase font-medium ${getSourceBadge(
              prompt.source
            )}`}
          >
            {prompt.source}
          </span>

          {/* Category */}
          <span className="rounded-sm border border-rule bg-surface-raised px-2 py-0.5 font-sans text-xs text-content-soft capitalize">
            {prompt.category}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-content-soft">
          <span className="font-mono">{timeAgo(prompt.createdAt)}</span>

          <button
            onClick={handleCopy}
            title="Copy prompt text"
            className="flex items-center gap-1 hover:text-content transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <Link
            href={`/admin/prompts/${prompt.id}`}
            className="hover:text-accent transition"
            title="Edit prompt"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Link>

          {onDelete && (
            <button
              onClick={() => onDelete(prompt.id)}
              className="hover:text-red-400 transition"
              title="Delete prompt"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {prompt.summary && (
          <h3 className="font-sans text-sm font-semibold text-content mb-1">
            {prompt.summary}
          </h3>
        )}

        <p className="font-mono text-xs text-content-soft leading-relaxed whitespace-pre-wrap">
          {expanded || prompt.text.length <= 160 ? prompt.text : `${prompt.text.slice(0, 160)}...`}
        </p>

        {prompt.text.length > 160 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 flex items-center gap-1 font-sans text-xs text-accent hover:underline focus:outline-none"
          >
            {expanded ? (
              <>
                Show Less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show Full Prompt ({prompt.text.length} chars) <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Notes Section if Present */}
      {prompt.notes && (
        <div className="rounded-sm border border-rule/60 bg-surface-raised/60 p-2.5 text-xs font-sans text-content-soft">
          <span className="font-medium text-content block mb-0.5">Notes & Context:</span>
          <p>{prompt.notes}</p>
        </div>
      )}

      {/* Tags and Linked Item */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-sm border border-rule/60 bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-content-soft"
            >
              <TagIcon className="h-2.5 w-2.5 text-accent" />
              {tag}
            </span>
          ))}
        </div>

        {prompt.linkedTo && (
          <span className="inline-flex items-center gap-1 font-sans text-xs text-accent">
            <Bookmark className="h-3 w-3" />
            Linked: <span className="font-mono font-medium">{prompt.linkedTo}</span>
          </span>
        )}
      </div>
    </div>
  );
}
