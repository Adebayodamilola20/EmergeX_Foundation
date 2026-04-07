"use client";

/**
 * StatsCard — Reusable stat card with value, label, and optional trend.
 *
 * Used on the admin dashboard for high-level KPIs.
 */

interface StatsCardProps {
  /** The main numeric or string value. */
  value: string | number;
  /** Short label describing the stat. */
  label: string;
  /** Optional trend indicator: positive = up arrow, negative = down arrow. */
  trend?: {
    value: number;
    label: string;
  };
  /** Optional icon (emoji or SVG). */
  icon?: string;
}

export function StatsCard({ value, label, trend, icon }: StatsCardProps) {
  const trendColor =
    trend && trend.value > 0
      ? "text-[var(--emergex-success)]"
      : trend && trend.value < 0
        ? "text-[var(--emergex-error)]"
        : "text-[var(--emergex-text-muted)]";

  const trendArrow =
    trend && trend.value > 0 ? "\u2191" : trend && trend.value < 0 ? "\u2193" : "";

  return (
    <div className="rounded-lg border border-[var(--emergex-border)] bg-[var(--emergex-bg-elevated)] p-6 transition-colors hover:border-[var(--emergex-border-focus)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--emergex-text-muted)]">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="mt-2 text-3xl font-bold text-[var(--emergex-text)]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {trend && (
        <div className={`mt-1 text-sm ${trendColor}`}>
          {trendArrow} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  );
}

/**
 * StatsCardSkeleton — Loading placeholder for StatsCard.
 */
export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--emergex-border)] bg-[var(--emergex-bg-elevated)] p-6 animate-pulse">
      <div className="h-4 w-24 rounded bg-[var(--emergex-bg-hover)]" />
      <div className="mt-3 h-8 w-32 rounded bg-[var(--emergex-bg-hover)]" />
      <div className="mt-2 h-3 w-20 rounded bg-[var(--emergex-bg-hover)]" />
    </div>
  );
}
