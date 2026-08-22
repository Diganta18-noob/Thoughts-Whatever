"use client";

import { useState, useEffect } from "react";
import { Globe, MapPin, Users, Filter, Compass } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface GeoData {
  period: string;
  totalGeoVisitors: number;
  countries: Array<{ country: string; code: string; visitors: number; pct: number }>;
  regions: Array<{ name: string; visitors: number; pct: number }>;
}

export default function GeographicAnalyticsPage() {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("30d");

  const fetchGeo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/geography?period=${period}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        toast.error("Failed to load geographic data");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeo();
  }, [period]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Geographic Distribution & Demographics
            </h1>
            <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent uppercase">
              AUDIENCE GEOGRAPHY
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            100% Real-time database telemetry: geographic readership breakdown by country and cultural literary hubs.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center bg-surface-raised p-1 rounded-sm border border-rule font-sans text-xs">
          {[
            { id: "7d", label: "7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "90d", label: "90 Days" },
            { id: "all", label: "All Time" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "px-2.5 py-1 rounded-sm transition text-xs",
                period === p.id
                  ? "bg-surface font-semibold text-content shadow-xs"
                  : "text-content-soft hover:text-content"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Mapping geographic audience telemetry from PostgreSQL...
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Countries Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="label">
                Top Reader Countries
              </h3>
              <span className="font-mono text-xs text-content-faint">
                {data.totalGeoVisitors.toLocaleString()} Total Logged Visits
              </span>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised overflow-hidden">
              {data.countries.length === 0 ? (
                <div className="p-8 text-center font-sans text-xs text-content-faint">
                  No country telemetry recorded for this period yet.
                </div>
              ) : (
                <table className="w-full text-left font-sans text-xs">
                  <thead>
                    <tr className="border-b border-rule bg-surface/60 text-[10px] uppercase tracking-wider text-content-faint font-mono">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Country</th>
                      <th className="p-3">Visitors</th>
                      <th className="p-3">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule/50">
                    {data.countries.map((c, idx) => (
                      <tr key={c.code} className="hover:bg-surface/50 transition">
                        <td className="p-3 font-mono text-content-faint w-12">{idx + 1}</td>
                        <td className="p-3 font-medium text-content flex items-center gap-2">
                          <span className="font-mono text-[10px] text-content-soft px-1 rounded bg-surface border border-rule">
                            {c.code}
                          </span>
                          {c.country}
                        </td>
                        <td className="p-3 font-mono text-content">{c.visitors.toLocaleString()}</td>
                        <td className="p-3 w-40">
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[10px] text-content-soft">
                              <span>{c.pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-rule/40 rounded-full overflow-hidden">
                              <div className="h-full bg-accent" style={{ width: `${c.pct}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Regional Hubs Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="label">
              Literary & Urban Hubs
            </h3>

            <div className="rounded-sm border border-rule bg-surface-raised p-5 space-y-4 font-sans text-xs">
              {data.regions.length === 0 ? (
                <div className="p-6 text-center font-sans text-xs text-content-faint">
                  No regional telemetry recorded for this period yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.regions.map((reg) => (
                    <div key={reg.name} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-content flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-accent" />
                          {reg.name}
                        </span>
                        <span className="font-mono text-content-soft">{reg.visitors.toLocaleString()} ({reg.pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-rule/40 rounded-full overflow-hidden">
                        <div className="h-full bg-content-soft" style={{ width: `${reg.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
