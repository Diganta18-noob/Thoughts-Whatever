"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  SearchCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Link2Off,
  ArrowRight,
  Sparkles,
  EyeOff,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface SEOScanResult {
  overallScore: number;
  totalPiecesScanned: number;
  brokenLinksCount: number;
  criticalIssuesCount: number;
  warningIssuesCount: number;
  scannedAt: string;
  categoryScores: {
    metaTags: number;
    contentStructure: number;
    linkHealth: number;
    imageOptimization: number;
  };
  brokenLinks: Array<{
    id: string;
    url: string;
    sourceTitle?: string | null;
    pieceId?: string | null;
    statusCode?: number | null;
    reason: string;
    ignored: boolean;
    lastChecked: string;
  }>;
  scannedPieces: Array<{
    pieceId: string;
    titleBn: string;
    slug: string;
    score: number;
    issues: Array<{
      type: string;
      severity: "critical" | "warning" | "info";
      message: string;
      field?: string;
    }>;
  }>;
}

export default function SEOScannerPage() {
  const [data, setData] = useState<SEOScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "broken-links" | "articles">("overview");

  const fetchSEO = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo");
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch {
      toast.error("Failed to load SEO scan results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSEO();
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      toast.loading("Running comprehensive SEO & link health audit...", { id: "seo-scan" });
      const res = await fetch("/api/admin/seo", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setData(json);
        toast.success(`SEO Audit complete! Overall score: ${json.overallScore}/100`, { id: "seo-scan" });
      } else {
        toast.error(json.error || "Scan failed", { id: "seo-scan" });
      }
    } catch {
      toast.error("Network error during scan", { id: "seo-scan" });
    } finally {
      setScanning(false);
    }
  };

  const handleIgnoreLink = async (linkId: string) => {
    try {
      const res = await fetch("/api/admin/seo/broken-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId, action: "ignore" }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Link ignored from future audits");
        fetchSEO();
      }
    } catch {
      toast.error("Failed to ignore link");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              SEO & Broken Link Scanner
            </h1>
            {data && (
              <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent uppercase">
                INDEX {data.overallScore} / 100
              </span>
            )}
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Automated search engine optimization surveillance, metadata auditing, and dead link detection.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunScan}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-white hover:bg-accent/90 transition disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", scanning && "animate-spin")} />
          {scanning ? "Scanning Articles..." : "Run SEO Audit Now"}
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Loading SEO audit metrics and broken link reports...
        </div>
      ) : data ? (
        <>
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-sm border border-rule bg-surface-raised p-5 space-y-2">
              <span className="label">
                Overall SEO Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-normal text-content">
                  {data.overallScore}
                </span>
                <span className="font-mono text-xs text-content-faint">/ 100</span>
              </div>
              <div className="h-1.5 w-full bg-rule/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    data.overallScore >= 80 ? "bg-emerald-600" : data.overallScore >= 60 ? "bg-amber-500" : "bg-rose-600"
                  )}
                  style={{ width: `${data.overallScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="label">
                  Meta Descriptions
                </span>
                <SearchCheck className="h-4 w-4 text-accent" />
              </div>
              <div className="font-serif text-3xl font-normal text-content">
                {data.categoryScores.metaTags}%
              </div>
              <p className="font-sans text-[11px] text-content-soft">Snippet quality & length</p>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="label">
                  Dead / Broken Links
                </span>
                <Link2Off className="h-4 w-4 text-rose-600" />
              </div>
              <div className="font-serif text-3xl font-normal text-rose-700 dark:text-rose-400">
                {data.brokenLinksCount}
              </div>
              <p className="font-sans text-[11px] text-content-soft">Requires URL repair</p>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="label">
                  Image Alt Optimization
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="font-serif text-3xl font-normal text-content">
                {data.categoryScores.imageOptimization}%
              </div>
              <p className="font-sans text-[11px] text-content-soft">Screen reader & SEO tags</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-rule pb-2 text-xs font-sans">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-3 py-1.5 rounded-sm transition",
                activeTab === "overview" ? "bg-surface font-semibold text-content border border-rule shadow-xs" : "text-content-soft hover:text-content"
              )}
            >
              All Scanned Articles ({data.scannedPieces.length})
            </button>
            <button
              onClick={() => setActiveTab("broken-links")}
              className={cn(
                "px-3 py-1.5 rounded-sm transition flex items-center gap-1.5",
                activeTab === "broken-links" ? "bg-surface font-semibold text-content border border-rule shadow-xs" : "text-content-soft hover:text-content"
              )}
            >
              Broken Links ({data.brokenLinksCount})
            </button>
          </div>

          {/* Tab 1: Articles Audit */}
          {activeTab === "overview" && (
            <div className="rounded-sm border border-rule bg-surface-raised overflow-hidden">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-rule bg-surface/60 text-[10px] uppercase tracking-wider text-content-faint font-mono">
                    <th className="p-3">SEO Score</th>
                    <th className="p-3">Article</th>
                    <th className="p-3">Identified Issues</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/50">
                  {data.scannedPieces.map((piece) => (
                    <tr key={piece.pieceId} className="hover:bg-surface/50 transition">
                      <td className="p-3 w-20">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center font-mono text-xs font-bold px-2 py-0.5 rounded-sm border",
                            piece.score >= 80 && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                            piece.score >= 60 && piece.score < 80 && "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                            piece.score < 60 && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                          )}
                        >
                          {piece.score}
                        </span>
                      </td>

                      <td className="p-3 max-w-xs">
                        <p className="font-medium text-content truncate font-bengali text-sm" lang="bn">
                          {piece.titleBn}
                        </p>
                        <span className="font-mono text-[10px] text-content-faint">/{piece.slug}</span>
                      </td>

                      <td className="p-3">
                        {piece.issues.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Fully optimized
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {piece.issues.map((iss, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "rounded px-1.5 py-0.5 font-sans text-[10px]",
                                  iss.severity === "critical" && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                                  iss.severity === "warning" && "bg-amber-500/10 text-amber-800 dark:text-amber-400",
                                  iss.severity === "info" && "bg-surface text-content-soft border border-rule/50"
                                )}
                              >
                                {iss.message}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/pieces/${piece.pieceId}`}
                          className="inline-flex items-center gap-1 font-sans text-xs text-accent hover:underline font-medium"
                        >
                          Edit &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Broken Links Table */}
          {activeTab === "broken-links" && (
            <div className="rounded-sm border border-rule bg-surface-raised overflow-hidden">
              {data.brokenLinks.length === 0 ? (
                <div className="p-12 text-center font-sans text-xs text-content-soft">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-serif text-base text-content">No Dead or Broken Links Detected</p>
                  <p className="text-content-faint mt-1">All internal and external references passed syntax and protocol verification.</p>
                </div>
              ) : (
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-rule bg-surface/60 text-[10px] uppercase tracking-wider text-content-faint font-mono">
                      <th className="p-3">Target URL</th>
                      <th className="p-3">Source Piece</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Last Checked</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule/50">
                    {data.brokenLinks.map((link) => (
                      <tr key={link.id} className={cn("hover:bg-surface/50 transition", link.ignored && "opacity-40")}>
                        <td className="p-3 font-mono text-[11px] text-rose-700 dark:text-rose-400 truncate max-w-xs">
                          {link.url}
                        </td>
                        <td className="p-3 font-medium text-content">
                          {link.sourceTitle || "Article"}
                        </td>
                        <td className="p-3 font-sans text-content-soft">
                          {link.reason}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-content-faint">
                          {new Date(link.lastChecked).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-2">
                          {link.pieceId && (
                            <Link
                              href={`/admin/pieces/${link.pieceId}`}
                              className="text-accent hover:underline"
                            >
                              Fix in Editor
                            </Link>
                          )}
                          {!link.ignored && (
                            <button
                              type="button"
                              onClick={() => handleIgnoreLink(link.id)}
                              className="text-content-faint hover:text-content text-[11px]"
                              title="Ignore link"
                            >
                              Ignore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
