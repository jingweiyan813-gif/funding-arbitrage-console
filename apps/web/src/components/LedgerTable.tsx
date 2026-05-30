import type { LedgerEvent } from "../types";

type LedgerTableProps = {
  events: LedgerEvent[];
};

export function LedgerTable({ events }: LedgerTableProps) {
  if (events.length === 0) {
    return <div className="empty-state">暂无账本记录。</div>;
  }

  return (
    <div className="table-scroll">
      <table className="paper-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>类型</th>
            <th>标题</th>
            <th>金额</th>
            <th>策略 / 成本</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{new Date(event.time).toLocaleString()}</td>
              <td>{event.type}</td>
              <td>{event.title}</td>
              <td className={event.amount >= 0 ? "positive" : "negative"}>
                {event.amount.toFixed(8)}
              </td>
              <td>
                <LedgerMeta meta={event.meta} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LedgerMeta({ meta }: { meta?: Record<string, unknown> }) {
  if (!meta) {
    return <span className="muted-inline">-</span>;
  }

  const strategyType = typeof meta.strategyType === "string" ? meta.strategyType : undefined;
  const borrowCost = typeof meta.borrowCost === "number" ? meta.borrowCost : undefined;

  return (
    <div className="ledger-meta">
      {strategyType ? <span className="strategy-badge">{formatStrategyType(strategyType)}</span> : null}
      {borrowCost !== undefined ? <small>借币利息成本：{borrowCost.toFixed(8)}</small> : null}
      {!strategyType && borrowCost === undefined ? <span className="muted-inline">-</span> : null}
    </div>
  );
}

function formatStrategyType(strategyType: string): string {
  return strategyType === "cash_and_carry" ? "现货-永续" : "跨所永续";
}
