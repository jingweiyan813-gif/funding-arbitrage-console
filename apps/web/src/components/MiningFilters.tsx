type MiningFiltersProps = {
  threshold: number;
  limit: number;
  includeTraps: boolean;
  isRefreshing?: boolean;
  onChange: (next: {
    threshold?: number;
    limit?: number;
    includeTraps?: boolean;
  }) => void;
  onRefresh: () => void;
};

export function MiningFilters({
  threshold,
  limit,
  includeTraps,
  isRefreshing = false,
  onChange,
  onRefresh
}: MiningFiltersProps) {
  return (
    <section className="mining-filters" aria-label="机会挖掘筛选">
      <label className="mining-filter-field mining-filter-field--threshold">
        <span className="mining-filter-label">极端阈值</span>
        <input
          min="0"
          step="0.0001"
          type="number"
          value={threshold}
          onChange={(event) =>
            onChange({ threshold: Number(event.currentTarget.value) })
          }
        />
        <small>0.003 = 0.3%/日</small>
      </label>

      <label className="mining-filter-field mining-filter-field--limit">
        <span className="mining-filter-label">返回数量</span>
        <input
          min="1"
          step="1"
          type="number"
          value={limit}
          onChange={(event) =>
            onChange({ limit: Number(event.currentTarget.value) })
          }
        />
      </label>

      <label className="mining-filter-toggle">
        <input
          checked={includeTraps}
          onChange={(event) =>
            onChange({ includeTraps: event.currentTarget.checked })
          }
          type="checkbox"
        />
        <span>包含陷阱机会</span>
      </label>

      <button
        className="refresh-button mining-filter-refresh"
        disabled={isRefreshing}
        onClick={onRefresh}
        type="button"
      >
        {isRefreshing ? "刷新中" : "刷新机会"}
      </button>
    </section>
  );
}
