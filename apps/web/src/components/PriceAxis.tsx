import type { Side } from "../types";

type AxisLeg = {
  label: string;
  side: Side;
  liqPrice: number;
};

type PriceAxisProps = {
  markPrice: number;
  legs: AxisLeg[];
};

export function PriceAxis({ markPrice, legs }: PriceAxisProps) {
  const longLegs = legs.filter((leg) => leg.side === "long");
  const shortLegs = legs.filter((leg) => leg.side === "short");

  return (
    <section className="price-axis-card">
      <div className="price-axis-labels">
        <span>多头强平区</span>
        <strong>当前价格 {formatPrice(markPrice)}</strong>
        <span>空头强平区</span>
      </div>
      <div className="price-axis">
        <div className="axis-zone axis-zone--left">
          {longLegs.map((leg) => (
            <span key={leg.label}>
              {leg.label} {formatPrice(leg.liqPrice)}
            </span>
          ))}
        </div>
        <div className="axis-current" />
        <div className="axis-zone axis-zone--right">
          {shortLegs.map((leg) => (
            <span key={leg.label}>
              {leg.label} {formatPrice(leg.liqPrice)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatPrice(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
}
