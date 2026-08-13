"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, X, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

interface PromptFormProps {
  initialData?: {
    id?: string;
    text: string;
    summary?: string | null;
    source: string;
    category: string;
    status: string;
    tags: string[];
    linkedTo?: string | null;
    notes?: string | null;
  };
  isEditing?: boolean;
}

export function PromptForm({ initialData, isEditing = false }: PromptFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [text, setText] = useState(initialData?.text || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [source, setSource] = useState(initialData?.source || "manual");
  const [category, setCategory] = useState(initialData?.category || "feature");
  const [status, setStatus] = useState(initialData?.status || "idea");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [linkedTo, setLinkedTo] = useState(initialData?.linkedTo || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Prompt text is required");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEditing ? `/api/admin/prompts/${initialData?.id}` : "/api/admin/prompts";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          summary: summary.trim() || undefined,
          source,
          category,
          status,
          tags,
          linkedTo: linkedTo.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(isEditing ? "Prompt updated!" : "Prompt saved to library!");
        router.push("/admin/prompts");
        router.refresh();
      } else {
        toast.error(json.error || "Failed to save prompt");
      }
    } catch {
      toast.error("Network error saving prompt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-rule pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/prompts"
            className="flex items-center justify-center rounded-sm border border-rule bg-surface p-1.5 text-content-soft hover:text-content transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="label">{isEditing ? "Edit Prompt" : "New Prompt Capture"}</span>
            <h2 className="mt-0.5 font-sans text-xl font-medium text-content">
              {isEditing ? "Update Prompt Details" : "Add Prompt to Library"}
            </h2>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-sm bg-accent px-5 py-2 font-sans text-xs font-medium text-surface transition hover:bg-accent/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {submitting ? "Saving..." : isEditing ? "Save Changes" : "Store Prompt"}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column - Main Inputs */}
        <div className="md:col-span-2 space-y-5">
          {/* Prompt Text (Required) */}
          <div className="space-y-1.5">
            <label className="block font-sans text-xs font-medium text-content">
              Prompt Text <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={8}
              placeholder="Paste or type the full prompt text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-sm border border-rule bg-surface-raised p-3 font-mono text-xs text-content placeholder:text-content-soft focus:border-accent focus:outline-none"
            />
          </div>

          {/* Summary / Title */}
          <div className="space-y-1.5">
            <label className="block font-sans text-xs font-medium text-content">
              Summary / Short Title <span className="text-content-soft">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Premium Editorial Image Layout System"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-sm border border-rule bg-surface-raised px-3 py-2 font-sans text-xs text-content placeholder:text-content-soft focus:border-accent focus:outline-none"
            />
          </div>

          {/* Notes & Context */}
          <div className="space-y-1.5">
            <label className="block font-sans text-xs font-medium text-content">
              Notes & Implementation Context <span className="text-content-soft">(Optional)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Add your own notes, links, or context about how this was implemented..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-sm border border-rule bg-surface-raised p-3 font-sans text-xs text-content placeholder:text-content-soft focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column - Metadata Controls */}
        <div className="rounded-sm border border-rule bg-surface p-4 space-y-5">
          <h3 className="font-sans text-xs font-semibold text-content border-b border-rule pb-2">
            Metadata & Classification
          </h3>

          {/* Source */}
          <div className="space-y-1.5">
            <label className="block font-sans text-xs font-medium text-content">Source Tool</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="kiro">Kiro</option>
              <option value="antigravity">Antigravity</option>
              <option value="manual">Manual Entry</option>
              <option value="other">Other Tool</option>
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block font-sans text-xs font-medium text-content">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="feature">Feature Request</option>
              <option value="design">Design System / Style</option>
              <option value="bug">Bug Fix</option>
              <option value="plan">Plan / Architecture</option>
              <option value="question">Question / Inquiry</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="block font-sans text-xs font-medium text-content">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="idea">💡 Idea</option>
              <option value="planned">🟡 Planned</option>
              <option value="in-progress">🔵 In Progress</option>
              <option value="done">🟢 Done</option>
              <option value="rejected">🔴 Rejected</option>
            </select>
          </div>

          {/* Linked Item */}
          <div className="space-y-1.5">
            <label className="block font-sans text-xs font-medium text-content">
              Linked Entity <span className="text-content-soft">(Slug / Feature)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. backup, image-layout, roktokorobi"
              value={linkedTo}
              onChange={(e) => setLinkedTo(e.target.value)}
              className="w-full rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-mono text-xs text-content placeholder:text-content-soft focus:border-accent focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block font-sans text-xs font-medium text-content">Tags</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type & press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 rounded-sm border border-rule bg-surface-raised px-2.5 py-1 font-mono text-xs text-content placeholder:text-content-soft focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="rounded-sm border border-rule bg-surface-raised px-2.5 py-1 font-sans text-xs text-content hover:bg-surface transition"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-sm border border-rule/60 bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-content"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-content-soft hover:text-red-400 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
