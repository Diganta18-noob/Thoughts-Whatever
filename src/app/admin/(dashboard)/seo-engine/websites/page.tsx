"use client";

import React, { useState } from "react";
import { useSEOWebsite } from "@/contexts/seo-website-context";
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Star,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WebsitesManagementPage() {
  const { websites, activeWebsiteId, setActiveWebsiteId, refreshWebsites, isLoading } = useSEOWebsite();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    homepageUrl: "",
    niche: "",
    targetCountry: "US",
    targetLanguage: "en",
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      domain: "",
      homepageUrl: "",
      niche: "",
      targetCountry: "US",
      targetLanguage: "en",
      isDefault: false,
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleOpenEdit = (w: any) => {
    setEditingId(w.id);
    setFormData({
      name: w.name,
      domain: w.domain,
      homepageUrl: w.homepageUrl,
      niche: w.niche,
      targetCountry: w.targetCountry,
      targetLanguage: w.targetLanguage,
      isDefault: w.isDefault,
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/seo-engine/websites/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update website");
        }
      } else {
        const res = await fetch("/api/admin/seo-engine/websites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create website");
        }
      }
      await refreshWebsites();
      setModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? All associated SEO tracking data will be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/seo-engine/websites/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete website");
      }
      await refreshWebsites();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h1 className="font-sans text-xl font-bold tracking-tight text-content">
            Websites & Domains Management
          </h1>
          <p className="font-sans text-xs text-content-soft mt-0.5">
            Configure multi-website profiles, target markets, and Google integrations
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-xs self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Website</span>
        </button>
      </div>

      {/* Grid of Websites */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {websites.map((w) => {
          const isActive = w.id === activeWebsiteId;

          return (
            <div
              key={w.id}
              className={cn(
                "relative rounded-xl border bg-surface p-5 shadow-xs transition flex flex-col justify-between",
                isActive
                  ? "border-accent ring-1 ring-accent shadow-sm"
                  : "border-rule hover:border-rule-strong"
              )}
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-sans text-sm font-bold text-content leading-tight">
                        {w.name}
                      </h3>
                      <a
                        href={w.homepageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-content-soft hover:text-accent flex items-center gap-1"
                      >
                        <span>{w.domain}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>

                  {w.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      <Star className="h-2.5 w-2.5 fill-amber-500" />
                      Default
                    </span>
                  )}
                </div>

                {/* Info Pills */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-content-soft">
                    <span className="font-mono text-[11px]">Niche:</span>
                    <span className="font-medium text-content text-right truncate max-w-[160px]">
                      {w.niche}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-content-soft">
                    <span className="font-mono text-[11px]">Market:</span>
                    <span className="font-mono text-[11px] text-content">
                      {w.targetCountry} &bull; {w.targetLanguage.toUpperCase()}
                    </span>
                  </div>

                  {/* Integrations Status */}
                  <div className="flex items-center justify-between pt-2 border-t border-rule/60 text-content-soft">
                    <span className="font-mono text-[11px]">Google Integrations:</span>
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.2",
                        w.gscConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-surface-raised text-content-faint"
                      )}>
                        GSC {w.gscConnected ? "✓" : "–"}
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.2",
                        w.gaConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-surface-raised text-content-faint"
                      )}>
                        GA {w.gaConnected ? "✓" : "–"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Counters Row */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-surface-raised/40 p-2 text-center text-xs">
                  <div>
                    <span className="block font-mono text-sm font-bold text-content">
                      {w.activeBacklinksCount ?? 0}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-content-faint">
                      {w.lostBacklinksCount && w.lostBacklinksCount > 0 ? `${w.lostBacklinksCount} Lost` : "Active Links"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-sm font-bold text-content">
                      {w._count?.keywords || 0}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-content-faint">
                      Keywords
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-sm font-bold text-content">
                      {w._count?.backlinkOpportunities || 0}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-content-faint">
                      Opps
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-rule flex items-center justify-between gap-2">
                {isActive ? (
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-accent">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active Workspace
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveWebsiteId(w.id)}
                    className="flex items-center gap-1 font-mono text-xs text-content-soft hover:text-content font-medium transition"
                  >
                    <span>Switch to this</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(w)}
                    className="rounded p-1.5 text-content-soft hover:bg-surface-raised hover:text-content transition"
                    title="Edit Website"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {!w.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDelete(w.id, w.name)}
                      className="rounded p-1.5 text-content-soft hover:bg-red-500/10 hover:text-red-500 transition"
                      title="Delete Website"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-rule bg-surface p-6 shadow-2xl animate-fade-up">
            <h2 className="font-sans text-base font-bold text-content">
              {editingId ? "Edit Website Profile" : "Register New Website"}
            </h2>
            <p className="font-sans text-xs text-content-soft mt-1">
              Provide project details to initialize tracking and opportunity discovery.
            </p>

            {errorMessage && (
              <div className="mt-3 rounded-lg bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400 font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-content-faint mb-1">
                  Website Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thoughts Whatever"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-rule bg-surface-raised px-3 py-2 text-content placeholder:text-content-faint focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-content-faint mb-1">
                  Domain Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. thoughtswhatever.in"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full rounded-md border border-rule bg-surface-raised px-3 py-2 text-content placeholder:text-content-faint focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-content-faint mb-1">
                  Homepage URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.thoughtswhatever.in"
                  value={formData.homepageUrl}
                  onChange={(e) => setFormData({ ...formData, homepageUrl: e.target.value })}
                  className="w-full rounded-md border border-rule bg-surface-raised px-3 py-2 text-content placeholder:text-content-faint focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-content-faint mb-1">
                  Industry / Niche
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Literature, AI Tools, Technology"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  className="w-full rounded-md border border-rule bg-surface-raised px-3 py-2 text-content placeholder:text-content-faint focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-content-faint mb-1">
                    Target Country
                  </label>
                  <input
                    type="text"
                    value={formData.targetCountry}
                    onChange={(e) => setFormData({ ...formData, targetCountry: e.target.value })}
                    className="w-full rounded-md border border-rule bg-surface-raised px-3 py-2 text-content focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-content-faint mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={formData.targetLanguage}
                    onChange={(e) => setFormData({ ...formData, targetLanguage: e.target.value })}
                    className="w-full rounded-md border border-rule bg-surface-raised px-3 py-2 text-content focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-rule text-accent focus:ring-accent"
                />
                <label htmlFor="isDefault" className="font-sans text-xs text-content select-none">
                  Set as default primary website
                </label>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-rule px-3.5 py-1.5 text-xs text-content-soft hover:bg-surface-raised transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
