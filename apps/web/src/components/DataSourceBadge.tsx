import type { ApiSource } from "../types";

const sourceCopy: Record<ApiSource, { label: string; description: string }> = {
  live: {
    label: "LIVE",
    description: "全部交易所数据正常"
  },
  partial: {
    label: "PARTIAL",
    description: "部分交易所数据暂缺"
  },
  mock: {
    label: "MOCK",
    description: "当前展示 fallback 模拟数据"
  }
};

type DataSourceBadgeProps = {
  source: ApiSource;
};

export function DataSourceBadge({ source }: DataSourceBadgeProps) {
  const copy = sourceCopy[source];

  return (
    <div className="source-badge-wrap">
      <span className={`source-badge source-badge--${source}`}>
        {copy.label}
      </span>
      <span className="source-description">{copy.description}</span>
    </div>
  );
}
