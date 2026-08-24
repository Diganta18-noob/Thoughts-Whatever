"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Send,
  Mail,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Copy,
  Download,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Building,
  GraduationCap,
  BookOpen,
  Award,
  ChevronRight,
  X,
  FileText,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  INITIAL_PROSPECTS,
  PROSPECT_CATEGORIES,
  EMAIL_TEMPLATES,
  type BacklinkProspect,
  type PitchStatus,
  type ProspectCategory,
  type ProspectPriority,
} from "@/lib/outreach-data";

const STATUS_LABELS: Record<PitchStatus, { label: string; bg: string; text: string }> = {
  not_contacted: { label: "Not Contacted", bg: "bg-surface-raised", text: "text-content-faint" },
  pitch_sent: { label: "Pitch Sent (Round 1)", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  follow_up_1: { label: "Follow-Up 1", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  follow_up_2: { label: "Follow-Up 2", bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
  secured: { label: "Backlink Secured! 🎉", bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  declined: { label: "Declined / No Reply", bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" },
};

const PRIORITY_BADGES: Record<ProspectPriority, { label: string; color: string }> = {
  high: { label: "High Authority", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" },
  quick_win: { label: "⚡ Quick Win", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  medium: { label: "Medium Priority", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30" },
};

export default function BacklinkOutreachDashboard() {
  const [prospects, setProspects] = useState<BacklinkProspect[]>(INITIAL_PROSPECTS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ProspectCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<PitchStatus | "all">("all");
  const [activeModalProspect, setActiveModalProspect] = useState<BacklinkProspect | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("academic_resource");

  // Load persisted statuses from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tw_backlink_outreach_v1");
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, PitchStatus>;
        setProspects((prev) =>
          prev.map((p) => (parsed[p.id] ? { ...p, defaultStatus: parsed[p.id] } : p))
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const updateStatus = (prospectId: string, newStatus: PitchStatus) => {
    setProspects((prev) => {
      const updated = prev.map((p) =>
        p.id === prospectId ? { ...p, defaultStatus: newStatus } : p
      );
      try {
        const stateMap: Record<string, PitchStatus> = {};
        updated.forEach((p) => {
          if (p.defaultStatus) stateMap[p.id] = p.defaultStatus;
        });
        localStorage.setItem("tw_backlink_outreach_v1", JSON.stringify(stateMap));
      } catch {
        // ignore
      }
      return updated;
    });
    toast.success(`Updated status for ${prospectId}`);
  };

  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
      const currentStatus = p.defaultStatus || "not_contacted";
      const matchesStatus = selectedStatus === "all" || currentStatus === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.targetPageNameBn.toLowerCase().includes(q) ||
        p.contactPersonOrDept.toLowerCase().includes(q);

      return matchesCat && matchesStatus && matchesQuery;
    });
  }, [prospects, selectedCategory, selectedStatus, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = prospects.length;
    let contacted = 0;
    let secured = 0;
    prospects.forEach((p) => {
      const s = p.defaultStatus || "not_contacted";
      if (s !== "not_contacted") contacted++;
      if (s === "secured") secured++;
    });
    return { total, contacted, secured, rate: total > 0 ? Math.round((secured / total) * 100) : 0 };
  }, [prospects]);

  // Generate personalized email
  const activeTemplate = useMemo(() => {
    return EMAIL_TEMPLATES.find((t) => t.id === selectedTemplateId) || EMAIL_TEMPLATES[0];
  }, [selectedTemplateId]);

  const generatedEmail = useMemo(() => {
    if (!activeModalProspect) return { subject: "", body: "" };
    let body = activeTemplate.body;
    let subject = activeTemplate.subject;

    const map: Record<string, string> = {
      "{{contact_person}}": activeModalProspect.contactPersonOrDept || "Sir/Madam",
      "{{organization_name}}": activeModalProspect.name,
      "{{target_url}}": activeModalProspect.targetUrl,
      "{{target_page_name}}": activeModalProspect.targetPageNameBn,
      "{{recommended_anchor}}": activeModalProspect.recommendedAnchorText,
    };

    Object.entries(map).forEach(([key, val]) => {
      body = body.split(key).join(val);
      subject = subject.split(key).join(val);
    });

    return { subject, body };
  }, [activeModalProspect, activeTemplate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Organization",
      "Domain",
      "Category",
      "Target URL",
      "Target Page",
      "Recommended Anchor Text",
      "Contact Person",
      "Contact Email",
      "Status",
      "Priority",
      "Notes",
    ];
    const rows = prospects.map((p) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.domain}"`,
      `"${p.category}"`,
      `"${p.targetUrl}"`,
      `"${p.targetPageNameBn.replace(/"/g, '""')}"`,
      `"${p.recommendedAnchorText.replace(/"/g, '""')}"`,
      `"${p.contactPersonOrDept.replace(/"/g, '""')}"`,
      `"${p.contactEmailOrUrl}"`,
      `"${p.defaultStatus || "not_contacted"}"`,
      `"${p.priority}"`,
      `"${p.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `thoughts_whatever_outreach_targets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Outreach targets exported to CSV!");
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-accent font-semibold uppercase">
            <Send className="h-4 w-4" />
            <span>SEO & Organic Backlink Strategy · Phase 4</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-content sm:text-3xl">
            Backlink & Outreach Command Center
          </h1>
          <p className="mt-1 text-xs text-content-soft">
            Track, pitch, and secure white-hat backlinks from top universities, literary journals, and WBCS portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/seo"
            className="rounded-md border border-rule px-3 py-1.5 text-xs text-content-soft hover:bg-surface-raised transition"
          >
            SEO Health Scanner
          </Link>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-surface shadow transition hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-rule bg-surface-raised/40 p-4">
          <div className="text-xs font-mono text-content-faint uppercase">Curated Prospects</div>
          <div className="mt-2 text-2xl font-bold font-mono text-content">{metrics.total}</div>
          <div className="mt-1 text-[0.6875rem] text-content-soft">Verified high-authority domains</div>
        </div>

        <div className="rounded-xl border border-rule bg-surface-raised/40 p-4">
          <div className="text-xs font-mono text-content-faint uppercase">Pitches in Motion</div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {metrics.contacted}
          </div>
          <div className="mt-1 text-[0.6875rem] text-content-soft">Active outreach conversations</div>
        </div>

        <div className="rounded-xl border border-rule bg-surface-raised/40 p-4">
          <div className="text-xs font-mono text-content-faint uppercase">Secured Backlinks</div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {metrics.secured}
          </div>
          <div className="mt-1 text-[0.6875rem] text-content-soft">Live inbound references</div>
        </div>

        <div className="rounded-xl border border-rule bg-surface-raised/40 p-4">
          <div className="text-xs font-mono text-content-faint uppercase">Pipeline Link Rate</div>
          <div className="mt-2 text-2xl font-bold font-mono text-accent">{metrics.rate}%</div>
          <div className="mt-1 text-[0.6875rem] text-content-soft">Conversion efficiency</div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ──────────────────────── */}
      <div className="space-y-3 rounded-xl border border-rule bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by university, organization, domain, or target page..."
              className="w-full rounded-md border border-rule bg-surface-raised/50 py-2 pl-9 pr-4 text-xs text-content placeholder:text-content-faint focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PitchStatus | "all")}
              className="rounded-md border border-rule bg-surface-raised/50 px-3 py-2 text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="all">All Statuses (সব অবস্থা)</option>
              <option value="not_contacted">Not Contacted</option>
              <option value="pitch_sent">Pitch Sent</option>
              <option value="follow_up_1">Follow-Up 1</option>
              <option value="follow_up_2">Follow-Up 2</option>
              <option value="secured">Backlink Secured</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 border-t border-rule/60 pt-3">
          {PROSPECT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-md px-2.5 py-1 text-xs transition ${
                selectedCategory === cat.id
                  ? "bg-accent text-surface font-semibold"
                  : "border border-rule bg-surface-raised/40 text-content-soft hover:text-content"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Prospects List ────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-content-faint">
          <span>Showing {filteredProspects.length} targets</span>
        </div>

        <div className="grid gap-3">
          {filteredProspects.map((prospect) => {
            const currentStatus = prospect.defaultStatus || "not_contacted";
            const statusConfig = STATUS_LABELS[currentStatus];
            const priorityConfig = PRIORITY_BADGES[prospect.priority];

            return (
              <div
                key={prospect.id}
                className="group rounded-xl border border-rule bg-surface-raised/30 p-5 hover:border-accent/50 hover:bg-surface-raised/50 transition"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left Column: Organization & Target Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-base text-content">{prospect.name}</h3>
                      <span className="inline-flex items-center gap-1 rounded border border-rule bg-surface px-2 py-0.5 font-mono text-[0.6875rem] text-content-faint">
                        {prospect.domain}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[0.65rem] font-medium ${priorityConfig.color}`}
                      >
                        {priorityConfig.label}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 pt-1 text-xs">
                      <div>
                        <span className="font-mono text-content-faint">Target Page: </span>
                        <span className="font-bengali font-medium text-content">
                          {prospect.targetPageNameBn}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-content-faint">Contact: </span>
                        <span className="text-content-soft font-mono">
                          {prospect.contactPersonOrDept} ({prospect.contactEmailOrUrl})
                        </span>
                      </div>
                    </div>

                    <div className="rounded-md border border-rule/60 bg-surface/70 p-2.5 text-xs">
                      <div className="font-mono text-[0.6875rem] uppercase text-accent font-semibold">
                        Recommended Anchor Text:
                      </div>
                      <div className="font-bengali text-content mt-0.5">
                        &ldquo;{prospect.recommendedAnchorText}&rdquo;
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status & Pitch Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 items-start sm:items-center lg:items-end">
                    {/* Status Dropdown */}
                    <select
                      value={currentStatus}
                      onChange={(e) => updateStatus(prospect.id, e.target.value as PitchStatus)}
                      className={`rounded-md border border-rule px-3 py-1.5 text-xs font-medium focus:outline-none transition ${statusConfig.bg} ${statusConfig.text}`}
                    >
                      <option value="not_contacted">Not Contacted</option>
                      <option value="pitch_sent">Pitch Sent (Round 1)</option>
                      <option value="follow_up_1">Follow-Up 1</option>
                      <option value="follow_up_2">Follow-Up 2</option>
                      <option value="secured">Backlink Secured! 🎉</option>
                      <option value="declined">Declined / No Reply</option>
                    </select>

                    {/* Action button to open pitch modal */}
                    <button
                      onClick={() => {
                        setActiveModalProspect(prospect);
                        setSelectedTemplateId(
                          prospect.category === "academic"
                            ? "academic_resource"
                            : prospect.category === "exam_prep"
                            ? "exam_prep_resource"
                            : "literary_webzine"
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-accent/15 border border-accent/30 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-surface transition shadow-xs"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Draft Pitch Email</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pitch Email Modal ─────────────────────────────── */}
      {activeModalProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-rule bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-rule pb-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-accent font-semibold uppercase">
                  <Mail className="h-4 w-4" />
                  <span>Outreach Pitch Generator</span>
                </div>
                <h2 className="mt-1 font-serif text-xl font-semibold text-content">
                  Pitch to {activeModalProspect.name}
                </h2>
                <div className="text-xs text-content-faint font-mono">
                  Target: {activeModalProspect.targetUrl}
                </div>
              </div>
              <button
                onClick={() => setActiveModalProspect(null)}
                className="rounded-md p-1.5 text-content-faint hover:bg-surface-raised hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-mono uppercase text-content-faint">
                Select Outreach Template:
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {EMAIL_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`rounded-lg border p-2.5 text-left text-xs transition ${
                      selectedTemplateId === t.id
                        ? "border-accent bg-accent/10 font-semibold text-accent"
                        : "border-rule bg-surface-raised/40 text-content-soft hover:border-accent/40"
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Email Content */}
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-content-faint mb-1.5">
                  <span>Subject Line:</span>
                  <button
                    onClick={() => copyToClipboard(generatedEmail.subject, "Subject")}
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy Subject</span>
                  </button>
                </div>
                <div className="rounded-lg border border-rule bg-surface-raised/60 p-3 text-xs font-medium text-content select-all">
                  {generatedEmail.subject}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono text-content-faint mb-1.5">
                  <span>Email Body:</span>
                  <button
                    onClick={() => copyToClipboard(generatedEmail.body, "Email body")}
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy Body</span>
                  </button>
                </div>
                <pre className="rounded-lg border border-rule bg-surface-raised/60 p-4 text-xs font-sans leading-relaxed text-content whitespace-pre-wrap select-all font-normal">
                  {generatedEmail.body}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
              <div className="text-xs text-content-faint">
                Recipient: <span className="font-mono text-content">{activeModalProspect.contactEmailOrUrl}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${activeModalProspect.contactEmailOrUrl}?subject=${encodeURIComponent(
                    generatedEmail.subject
                  )}&body=${encodeURIComponent(generatedEmail.body)}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-surface shadow transition hover:opacity-90"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Open in Mail App</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
