"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function TrendChart({
  data,
}: {
  data: { date: string; views: number; instagramClicks: number }[];
}) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold font-heading">পাঠক ও ইনস্টাগ্রাম ট্র্যাফিক ট্রেন্ড</h3>
        <div className="flex items-center gap-4 text-xs font-heading">
          <span className="flex items-center gap-1.5 text-red-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> নিবন্ধ পঠিত সংখ্যা
          </span>
          <span className="flex items-center gap-1.5 text-pink-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-600" /> ইনস্টাগ্রাম লিঙ্ক ক্লিক
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#db2777" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#db2777" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1c1917",
                borderRadius: "12px",
                color: "#fff",
                border: "none",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#dc2626"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorViews)"
              name="পাঠিত সংখ্যা"
            />
            <Area
              type="monotone"
              dataKey="instagramClicks"
              stroke="#db2777"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClicks)"
              name="রিল ক্লিক"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
