import type { PaperPosition } from "../types";

type PositionCardProps = {
  position: PaperPosition;
};

export function PositionCard({ position }: PositionCardProps) {
  const buffer = calculateBuffer(position);
  const riskClass =
    position.status === "liquidated"
      ? "critical"
      : buffer < 5
        ? "critical"
        : buffer < 10
          ? "warning"
          : "safe";

  return (
    <article className={`position-card position-card--${riskClass}`}>
      <div className="position-card-heading">
        <div>
          <strong>{position.symbol}</strong>
          <span>{position.exchange} · {position.side}</span>
          {position.strategyType ? (
            <span className="strategy-badge">{formatStrategyType(position.strategyType)}</span>
          ) : null}
        </div>
        <span className={`status status--${position.status === "open" ? "ok" : "fake"}`}>
          {position.status}
        </span>
      </div>
      <div className="position-card-grid">
        <Metric label="名义本金" value={formatMoney(position.notional)} />
        <Metric label="杠杆" value={`${position.leverage}x`} />
        <Metric label="开仓价" value={formatMoney(position.entryPrice)} />
        <Metric label="标记价" value={formatMoney(position.markPrice)} />
        <Metric label="保证金" value={formatMoney(position.margin)} />
        <Metric label="强平价" value={formatMoney(position.liqPrice)} />
        <Metric
          label="浮动盈亏"
          tone={position.unrealizedPnl}
          value={formatMoney(position.unrealizedPnl ?? 0)}
        />
        <Metric label="安全垫" value={`${buffer.toFixed(2)}%`} />
      </div>
      <small>开仓时间：{formatDate(position.openedAt)}</small>
    </article>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: number }) {
  const toneClass = tone === undefined ? "" : tone >= 0 ? "positive" : "negative";

  return (
    <div className="position-metric">
      <span>{label}</span>
      <strong className={toneClass}>{value}</strong>
    </div>
  );
}

function calculateBuffer(position: PaperPosition): number {
  if (position.markPrice <= 0) {
    return 0;
  }

  const distance =
    position.side === "long"
      ? position.markPrice - position.liqPrice
      : position.liqPrice - position.markPrice;

  return (distance / position.markPrice) * 100;
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function formatDate(value: number): string {
  return new Date(value).toLocaleString();
}

function formatStrategyType(strategyType: "cross_exchange_perp" | "cash_and_carry"): string {
  return strategyType === "cash_and_carry" ? "现货-永续" : "跨所永续";
}
