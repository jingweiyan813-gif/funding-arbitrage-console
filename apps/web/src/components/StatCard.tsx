import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {detail ? <span className="stat-detail">{detail}</span> : null}
    </article>
  );
}
