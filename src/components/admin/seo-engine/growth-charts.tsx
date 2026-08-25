"use client";

import React, { useState } from "react";
import { ArrowUpRight, TrendingUp, Link2, Globe2 } from "lucide-react";

interface GrowthChartsProps {
  trafficData: Array<{ month: string; traffic: number }>;
  backlinkData: Array<{ month: string; backlinks: number; referringDomains: number }>;
}

export function SEOGrowthCharts({ trafficData, backlinkData }: GrowthChartsProps) {
  const [activeTab, setActiveTab] = useState<"traffic" | "backlinks">("traffic");

  // Calculate scales for SVG Traffic chart
  const maxTraffic = Math.max(...trafficData.map((d) => d.traffic), 100);
  const minTraffic = Math.min(...trafficData.map((d) => d.traffic), 0);
  const chartHeight = 160;
  const chartWidth = 500;

  // Build SVG path points for traffic
  const trafficPoints = trafficData.map((d, i) => {
    const x = (i / (trafficData.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - 20 - ((d.traffic - minTraffic) / (maxTraffic - minTraffic || 1)) * (chartHeight - 40);
    return { x, y, ...d };
  });

  const trafficPathD = trafficPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ""
  );

  const trafficAreaD = `${trafficPathD} L ${trafficPoints[trafficPoints.length - 1]?.x} ${chartHeight - 10} L ${trafficPoints[0]?.x} ${chartHeight - 10} Z`;

  // Calculate scales for Backlink chart
  const maxBacklinks = Math.max(...backlinkData.map((d) => d.backlinks), 10);
  const backlinkPoints = backlinkData.map((d, i) => {
    const x = (i / (backlinkData.length - 1)) * (chartWidth - 40) + 20;
    const yB = chartHeight - 20 - (d.backlinks / maxBacklinks) * (chartHeight - 40);
    const yR = chartHeight - 20 - (d.referringDomains / maxBacklinks) * (chartHeight - 40);
    return { x, yB, yR, ...d };
  });

  const backlinkPathD = backlinkPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.yB}` : `${acc} L ${p.x} ${p.yB}`),
    ""
  );

  const referringPathD = backlinkPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.yR}` : `${acc} L ${p.x} ${p.yR}`),
    ""
  );

  return (
    <div className="rounded-xl border border-rule bg-surface p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="font-sans text-sm font-semibold text-content">
              Organic Growth & Link Velocity
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-content-soft">
            Historical trajectory across organic traffic, live backlinks, and referring domains
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center rounded-lg border border-rule bg-surface-raised/50 p-0.5 self-start">
          <button
            type="button"
            onClick={() => setActiveTab("traffic")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition ${
              activeTab === "traffic"
                ? "bg-surface text-content shadow-xs"
                : "text-content-soft hover:text-content"
            }`}
          >
            <Globe2 className="h-3 w-3 text-accent" />
            <span>Organic Traffic</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("backlinks")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition ${
              activeTab === "backlinks"
                ? "bg-surface text-content shadow-xs"
                : "text-content-soft hover:text-content"
            }`}
          >
            <Link2 className="h-3 w-3 text-emerald-500" />
            <span>Backlinks & Domains</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-5">
        {activeTab === "traffic" ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] text-content-faint">Monthly Organic Visitors</span>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold">
                <span>+24.8% past 6 mo</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-44 overflow-visible"
              >
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent, #6366f1)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--color-accent, #6366f1)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Grid Lines */}
                <line x1="20" y1="30" x2={chartWidth - 20} y2="30" stroke="currentColor" className="text-rule" strokeDasharray="3 3" />
                <line x1="20" y1="80" x2={chartWidth - 20} y2="80" stroke="currentColor" className="text-rule" strokeDasharray="3 3" />
                <line x1="20" y1="130" x2={chartWidth - 20} y2="130" stroke="currentColor" className="text-rule" strokeDasharray="3 3" />

                {/* Area and Line */}
                <path d={trafficAreaD} fill="url(#trafficGradient)" />
                <path d={trafficPathD} fill="none" stroke="currentColor" className="text-accent" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Data Points */}
                {trafficPoints.map((p, i) => (
                  <g key={i} className="group cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="fill-surface stroke-accent stroke-2 group-hover:r-6 transition-all"
                    />
                    <text
                      x={p.x}
                      y={chartHeight - 2}
                      textAnchor="middle"
                      className="fill-content-faint font-mono text-[9px]"
                    >
                      {p.month}
                    </text>
                    <text
                      x={p.x}
                      y={p.y - 8}
                      textAnchor="middle"
                      className="fill-content font-mono text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {p.traffic.toLocaleString()}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-content-soft">Total Backlinks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span className="text-content-soft">Referring Domains</span>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                +18 new domains
              </span>
            </div>

            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-44 overflow-visible"
              >
                {/* Horizontal Guide Grid Lines */}
                <line x1="20" y1="30" x2={chartWidth - 20} y2="30" stroke="currentColor" className="text-rule" strokeDasharray="3 3" />
                <line x1="20" y1="80" x2={chartWidth - 20} y2="80" stroke="currentColor" className="text-rule" strokeDasharray="3 3" />
                <line x1="20" y1="130" x2={chartWidth - 20} y2="130" stroke="currentColor" className="text-rule" strokeDasharray="3 3" />

                {/* Backlinks Line */}
                <path d={backlinkPathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Referring Domains Line */}
                <path d={referringPathD} fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points */}
                {backlinkPoints.map((p, i) => (
                  <g key={i} className="group cursor-pointer">
                    <circle cx={p.x} cy={p.yB} r="3.5" className="fill-surface stroke-emerald-500 stroke-2 group-hover:r-5 transition-all" />
                    <circle cx={p.x} cy={p.yR} r="3" className="fill-surface stroke-cyan-500 stroke-2 group-hover:r-4 transition-all" />
                    <text
                      x={p.x}
                      y={chartHeight - 2}
                      textAnchor="middle"
                      className="fill-content-faint font-mono text-[9px]"
                    >
                      {p.month}
                    </text>
                    <text
                      x={p.x}
                      y={p.yB - 8}
                      textAnchor="middle"
                      className="fill-emerald-600 dark:fill-emerald-400 font-mono text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {p.backlinks}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
