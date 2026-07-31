"use client";

import { useTranslation } from "@/components/providers/language-provider";

interface TrendData {
  date: string;
  views: number;
  visitors: number;
}

interface TrendChartProps {
  data: TrendData[];
}

export function TrendChart({ data }: TrendChartProps) {
  const t = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-rule font-sans text-sm text-content-faint">
        {t("common.empty")}
      </div>
    );
  }

  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const height = 180;
  const width = 600;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (d.views / maxViews) * (height - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="border border-rule bg-surface p-5">
      <div className="flex items-center justify-between pb-4">
        <div>
          <span className="label">
            Traffic Trends
          </span>
          <h3 className="font-sans text-lg font-medium text-content">
            {t("admin.dashboard.trafficTrend")}
          </h3>
        </div>
        <div className="flex items-center gap-4 font-sans text-xs text-content-soft">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span>{t("admin.dashboard.totalViews")}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          {/* Background Grid Lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="text-rule/40" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" className="text-rule/40" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-rule" />

          {/* Area gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaD} fill="url(#chartGradient)" />
          <path d={pathD} fill="none" stroke="rgb(var(--accent))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="3"
              className="fill-surface stroke-accent text-accent transition hover:r-5"
            >
              <title>{`${p.date}: ${p.views} views`}</title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex justify-between font-mono text-[0.6875rem] text-content-faint">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
