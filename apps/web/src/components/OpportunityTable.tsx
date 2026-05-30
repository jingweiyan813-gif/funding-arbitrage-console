import type { ArbOpportunity } from "../types";
import { Tooltip } from "./Tooltip";

type OpportunityTableProps = {
  opportunities: ArbOpportunity[];
  onCalculate?: (opportunity: ArbOpportunity) => void;
  onLiquidation?: (opportunity: ArbOpportunity) => void;
};

export function OpportunityTable({
  opportunities,
  onCalculate,
  onLiquidation
}: OpportunityTableProps) {
  if (opportunities.length === 0) {
    return (
      <div className="empty-state">
        当前筛选条件下暂无跨交易所资金费率机会。
      </div>
    );
  }

  const maxSpread = Math.max(...opportunities.map((item) => item.spread));

  return (
    <div className="table-scroll">
      <table className="opportunity-table">
        <thead>
          <tr>
            <th>币种</th>
            <th>所A / 费率</th>
            <th>所B / 费率</th>
            <th>费差</th>
            <th>
              <Tooltip
                label="净费差"
                text="费差扣除两边手续费后的剩余边际，netEdge <= 0 时为假机会。"
              />
            </th>
            <th>建议方向</th>
            <th>流动性</th>
            <th>
              <Tooltip
                label="结算周期"
                text="资金费率结算间隔，常见为 8 小时，也可能因交易所或品种而不同。"
              />
            </th>
            <th>估算年化</th>
            <th>净年化</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity) => (
            <tr
              className={[
                opportunity.fakeOpportunity ? "is-fake" : "",
                opportunity.spread === maxSpread ? "is-top-spread" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              key={`${opportunity.symbol}-${opportunity.legA.exchange}-${opportunity.legB.exchange}`}
            >
              <td className="symbol-cell">{opportunity.symbol}</td>
              <td>
                <ExchangeRate
                  exchange={opportunity.legA.exchange}
                  rate={opportunity.legA.rate}
                />
              </td>
              <td>
                <ExchangeRate
                  exchange={opportunity.legB.exchange}
                  rate={opportunity.legB.rate}
                />
              </td>
              <td>{formatPercent(opportunity.spread, 4)}</td>
              <td className={opportunity.netEdge < 0 ? "negative" : "positive"}>
                {formatPercent(opportunity.netEdge, 4)}
              </td>
              <td>{opportunity.direction}</td>
              <td>
                <span className={`liquidity liquidity--${opportunity.liquidity}`}>
                  {opportunity.liquidity}
                </span>
              </td>
              <td>{opportunity.intervalHours}h</td>
              <td>{formatPercent(opportunity.estApr, 2)}</td>
              <td className={opportunity.netApr < 0 ? "negative" : "positive"}>
                {formatPercent(opportunity.netApr, 2)}
              </td>
              <td>
                {opportunity.fakeOpportunity ? (
                  <span className="status status--fake">
                    假机会：扣费后为负
                  </span>
                ) : (
                  <span className="status status--ok">可观察</span>
                )}
              </td>
              <td>
                <div className="row-actions">
                  <button
                    onClick={() => onCalculate?.(opportunity)}
                    type="button"
                  >
                    去计算
                  </button>
                  <button
                    onClick={() => onLiquidation?.(opportunity)}
                    type="button"
                  >
                    看爆仓
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExchangeRate({
  exchange,
  rate
}: {
  exchange: string;
  rate: number;
}) {
  return (
    <div className="exchange-rate">
      <span>{exchange}</span>
      <strong className={rate < 0 ? "negative" : "positive"}>
        {formatPercent(rate, 4)}
      </strong>
    </div>
  );
}

function formatPercent(value: number, digits: number): string {
  return `${(value * 100).toFixed(digits)}%`;
}
