"use client";

/**
 * UsageChart — Recharts line chart for token usage over time.
 *
 * Displays daily token consumption as a line chart with area fill.
 * Supports toggling between tokens, sessions, and active users.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useState } from "react";

interface UsageDataPoint {
  date: string;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  sessions: number;
  activeUsers: number;
}

interface UsageChartProps {
  data: UsageDataPoint[];
  title?: string;
}

type MetricKey = "totalTokens" | "sessions" | "activeUsers";

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; formatter: (v: number) => string }> = {
  totalTokens: {
    label: "Tokens",
    color: "var(--emergex-accent)",
    formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v),
  },
  sessions: {
    label: "Sessions",
    color: "var(--emergex-success)",
    formatter: (v) => String(v),
  },
  activeUsers: {
    label: "Active Users",
    color: "var(--emergex-warning)",
    formatter: (v) => String(v),
  },
};

export function UsageChart({ data, title = "Usage (Last 30 Days)" }: UsageChartProps) {
  const [metric, setMetric] = useState<MetricKey>("totalTokens");
  const config = METRIC_CONFIG[metric];

  // Format dates for display (MM/DD)
  const chartData = data.map((d) => ({
    ...d,
    displayDate: `${d.date.slice(5, 7)}/${d.date.slice(8, 10)}`,
  }));

  return (
    <div className="rounded-lg border border-[var(--emergex-border)] bg-[var(--emergex-bg-elevated)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--emergex-text)]">{title}</h3>
        <div className="flex gap-1">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                metric === key
                  ? "bg-[var(--emergex-accent)] text-[var(--emergex-text)]"
                  : "text-[var(--emergex-text-muted)] hover:text-[var(--emergex-text-secondary)]"
              }`}
            >
              {METRIC_CONFIG[key].label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--emergex-border)"
              vertical={false}
            />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: "var(--emergex-text-muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--emergex-border)" }}
              tickLine={false}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              tick={{ fill: "var(--emergex-text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={config.formatter}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--emergex-bg-elevated)",
                border: "1px solid var(--emergex-border)",
                borderRadius: "6px",
                color: "var(--emergex-text)",
                fontSize: "12px",
              }}
              formatter={(value: number) => [config.formatter(value), config.label]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={config.color}
              strokeWidth={2}
              fill="url(#chartGradient)"
              dot={false}
              activeDot={{ r: 4, fill: config.color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * UsageChartSkeleton — Loading placeholder.
 */
export function UsageChartSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--emergex-border)] bg-[var(--emergex-bg-elevated)] p-6 animate-pulse">
      <div className="mb-4 h-4 w-40 rounded bg-[var(--emergex-bg-hover)]" />
      <div className="h-64 rounded bg-[var(--emergex-bg-hover)]" />
    </div>
  );
}
