"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Save, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

export function QuickAddPromptModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [text, setText] = useState("");
  const [source, setSource] = useState("manual");
  const [category, setCategory] = useState("feature");
  const [status, setStatus] = useState("idea");
  const [tags, setTags] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Prompt text is required");
      return;
    }

    setSubmitting(true);
    try {
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          source,
          category,
          status,
          tags: parsedTags,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Prompt saved to library!");
        setText("");
        setTags("");
        setIsOpen(false);
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
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 font-sans text-xs font-semibold text-surface shadow-lg transition hover:scale-105 hover:bg-accent/90"
        title="Quick Capture Prompt to Library"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span>Capture Prompt</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-sm border border-rule bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h3 className="font-sans text-base font-semibold text-content">
                  Quick Prompt Capture
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-content-soft hover:text-content transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-sans text-xs font-medium text-content">
                  Prompt Text <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste or type the prompt text..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface-raised p-3 font-mono text-xs text-content placeholder:text-content-soft focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-xs font-medium text-content mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full rounded-sm border border-rule bg-surface-raised px-2.5 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
                  >
                    <option value="kiro">Kiro</option>
                    <option value="antigravity">Antigravity</option>
                    <option value="manual">Manual</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-xs font-medium text-content mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-sm border border-rule bg-surface-raised px-2.5 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
                  >
                    <option value="feature">Feature</option>
                    <option value="design">Design</option>
                    <option value="bug">Bug</option>
                    <option value="plan">Plan</option>
                    <option value="question">Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs font-medium text-content mb-1">
                  Tags <span className="text-content-soft">(comma separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. backup, layout, instagram"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-mono text-xs text-content placeholder:text-content-soft focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-sm border border-rule bg-surface-raised px-4 py-1.5 font-sans text-xs text-content-soft hover:text-content transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-sm bg-accent px-4 py-1.5 font-sans text-xs font-medium text-surface transition hover:bg-accent/90 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {submitting ? "Saving..." : "Save to Library"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
