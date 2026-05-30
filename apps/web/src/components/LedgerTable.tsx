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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
