import type { ReactNode } from "react";

type DashboardMetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger";
};

export function DashboardMetricCard({
  label,
  value,
  detail,
  tone = "neutral"
}: DashboardMetricCardProps) {
  return (
    <article className={`dashboard-metric-card dashboard-metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}
